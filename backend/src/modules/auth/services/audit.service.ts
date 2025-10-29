import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAuthEvent(
    action: string,
    userId: string | null,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          resource: 'auth',
          userId,
          details,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging shouldn't break the main flow
      console.error('Failed to create audit log:', error);
    }
  }

  async logLogin(
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      userId,
      { success },
      ipAddress,
      userAgent,
    );
  }

  async logLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'LOGOUT',
      userId,
      { timestamp: new Date().toISOString() },
      ipAddress,
      userAgent,
    );
  }

  async logRegistration(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'USER_REGISTRATION',
      userId,
      { email },
      ipAddress,
      userAgent,
    );
  }

  async logPasswordChange(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'PASSWORD_CHANGED',
      userId,
      { timestamp: new Date().toISOString() },
      ipAddress,
      userAgent,
    );
  }

  async logPasswordReset(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'PASSWORD_RESET_REQUESTED',
      null,
      { email },
      ipAddress,
      userAgent,
    );
  }

  async logTwoFactorEnabled(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'TWO_FACTOR_ENABLED',
      userId,
      { timestamp: new Date().toISOString() },
      ipAddress,
      userAgent,
    );
  }

  async logTwoFactorDisabled(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'TWO_FACTOR_DISABLED',
      userId,
      { timestamp: new Date().toISOString() },
      ipAddress,
      userAgent,
    );
  }

  async logApiKeyCreated(
    userId: string,
    keyName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'API_KEY_CREATED',
      userId,
      { keyName },
      ipAddress,
      userAgent,
    );
  }

  async logApiKeyRevoked(
    userId: string,
    keyName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'API_KEY_REVOKED',
      userId,
      { keyName },
      ipAddress,
      userAgent,
    );
  }

  async logEmailVerified(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'EMAIL_VERIFIED',
      userId,
      { timestamp: new Date().toISOString() },
      ipAddress,
      userAgent,
    );
  }

  async logTokenRefresh(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuthEvent(
      'TOKEN_REFRESHED',
      userId,
      { timestamp: new Date().toISOString() },
      ipAddress,
      userAgent,
    );
  }
}
