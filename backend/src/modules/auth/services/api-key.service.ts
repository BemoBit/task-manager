import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { AuditService } from './audit.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generate a new API key
   */
  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new API key for a user
   */
  async createApiKey(
    userId: string,
    name: string,
    expiresInDays?: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; key: string; name: string; expiresAt: Date | null }> {
    const key = this.generateApiKey();

    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const apiKey = await this.prisma.apiKey.create({
      data: {
        key,
        name,
        userId,
        expiresAt,
      },
    });

    // Log API key creation
    await this.auditService.logApiKeyCreated(
      userId,
      name,
      ipAddress,
      userAgent,
    );

    return {
      id: apiKey.id,
      key: apiKey.key,
      name: apiKey.name,
      expiresAt: apiKey.expiresAt,
    };
  }

  /**
   * Validate an API key
   */
  async validateApiKey(key: string): Promise<{ userId: string } | null> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key },
    });

    if (!apiKey) {
      return null;
    }

    // Check if key is active
    if (!apiKey.isActive) {
      return null;
    }

    // Check if key is expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp
    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return { userId: apiKey.userId };
  }

  /**
   * Get all API keys for a user
   */
  async getUserApiKeys(userId: string): Promise<any[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        // Don't return the actual key for security
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return apiKeys;
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(
    keyId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to revoke this API key',
      );
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    // Log API key revocation
    await this.auditService.logApiKeyRevoked(
      userId,
      apiKey.name,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(keyId: string, userId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to delete this API key',
      );
    }

    await this.prisma.apiKey.delete({
      where: { id: keyId },
    });
  }

  /**
   * Clean up expired API keys
   */
  async cleanupExpiredKeys(): Promise<void> {
    await this.prisma.apiKey.updateMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }
}
