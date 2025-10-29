import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@/modules/database/prisma.service';
import { JwtPayload, AuthTokens } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.accessTokenExpiry =
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
    this.refreshTokenExpiry =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'secret';
  }

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
        expiresIn: this.accessTokenExpiry,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
        expiresIn: this.refreshTokenExpiry,
      }),
    ]);

    // Store refresh token in database
    await this.storeRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Verify and validate a refresh token
   */
  async verifyRefreshToken(refreshToken: string): Promise<JwtPayload | null> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        return null;
      }

      // Verify token signature and expiration
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.jwtSecret,
        },
      );

      // Check if token exists in database and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.isRevoked) {
        return null;
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      await this.prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });

      // Also blacklist the token in Redis
      await this.blacklistToken(refreshToken);
    } catch (error) {
      // Token might not exist in database, ignore
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  /**
   * Blacklist a token in Redis (for access tokens on logout)
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as JwtPayload;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.cacheManager.set(
            `blacklist:${token}`,
            true,
            ttl * 1000, // Convert to milliseconds
          );
        }
      }
    } catch (error) {
      console.error('Failed to blacklist token:', error);
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.cacheManager.get(`blacklist:${token}`);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a password reset token
   */
  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store password reset token in Redis
   */
  async storePasswordResetToken(
    email: string,
    token: string,
  ): Promise<void> {
    const ttl = 3600; // 1 hour
    await this.cacheManager.set(
      `password-reset:${token}`,
      email,
      ttl * 1000,
    );
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<string | null> {
    try {
      const email = await this.cacheManager.get<string>(
        `password-reset:${token}`,
      );
      return email || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete password reset token
   */
  async deletePasswordResetToken(token: string): Promise<void> {
    await this.cacheManager.del(`password-reset:${token}`);
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store email verification token in Redis
   */
  async storeEmailVerificationToken(
    email: string,
    token: string,
  ): Promise<void> {
    const ttl = 86400; // 24 hours
    await this.cacheManager.set(
      `email-verify:${token}`,
      email,
      ttl * 1000,
    );
  }

  /**
   * Verify email verification token
   */
  async verifyEmailVerificationToken(token: string): Promise<string | null> {
    try {
      const email = await this.cacheManager.get<string>(
        `email-verify:${token}`,
      );
      return email || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete email verification token
   */
  async deleteEmailVerificationToken(token: string): Promise<void> {
    await this.cacheManager.del(`email-verify:${token}`);
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
