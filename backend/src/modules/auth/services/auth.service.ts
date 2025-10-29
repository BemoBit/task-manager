import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { AuditService } from './audit.service';
import { BruteForceProtectionService } from './brute-force-protection.service';
import * as bcrypt from 'bcrypt';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from '../dto';
import { AuthResponse, TwoFactorSecret } from '../interfaces';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
    private readonly auditService: AuditService,
    private readonly bruteForceProtection: BruteForceProtectionService,
  ) {}

  /**
   * Register a new user
   */
  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    // Generate email verification token
    const verificationToken =
      this.tokenService.generateEmailVerificationToken();
    await this.tokenService.storeEmailVerificationToken(
      email,
      verificationToken,
    );

    // Log registration
    await this.auditService.logRegistration(
      user.id,
      email,
      ipAddress,
      userAgent,
    );

    // Generate tokens
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  /**
   * Login user
   */
  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const { email, password, twoFactorCode } = loginDto;

    // Check if account is locked due to brute force attempts
    await this.bruteForceProtection.checkAndThrow(email);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await this.bruteForceProtection.recordFailedAttempt(email);
      await this.auditService.logLogin(
        'unknown',
        false,
        ipAddress,
        userAgent,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      await this.auditService.logLogin(user.id, false, ipAddress, userAgent);
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.bruteForceProtection.recordFailedAttempt(email);
      await this.auditService.logLogin(user.id, false, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check two-factor authentication
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        throw new BadRequestException('Two-factor authentication code required');
      }

      if (!user.twoFactorSecret) {
        throw new UnauthorizedException('Two-factor authentication not properly configured');
      }

      const isValidToken = this.twoFactorService.verifyToken(
        user.twoFactorSecret,
        twoFactorCode,
      );

      if (!isValidToken) {
        await this.bruteForceProtection.recordFailedAttempt(email);
        await this.auditService.logLogin(user.id, false, ipAddress, userAgent);
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    // Reset brute force attempts on successful login
    await this.bruteForceProtection.resetAttempts(email);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login
    await this.auditService.logLogin(user.id, true, ipAddress, userAgent);

    // Generate tokens
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  /**
   * Logout user
   */
  async logout(
    userId: string,
    accessToken: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Blacklist access token
    await this.tokenService.blacklistToken(accessToken);

    // Revoke refresh token
    await this.tokenService.revokeRefreshToken(refreshToken);

    // Log logout
    await this.auditService.logLogout(userId, ipAddress, userAgent);
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // Verify refresh token
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Revoke old refresh token (rotation)
    await this.tokenService.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    // Log token refresh
    await this.auditService.logTokenRefresh(user.id, ipAddress, userAgent);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = this.tokenService.generatePasswordResetToken();
    await this.tokenService.storePasswordResetToken(email, resetToken);

    // Log password reset request
    await this.auditService.logPasswordReset(email, ipAddress, userAgent);

    // TODO: Send email with reset token
    // In production, you would send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  /**
   * Reset password
   */
  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Verify token
    const email = await this.tokenService.verifyPasswordResetToken(token);

    if (!email) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete reset token
    await this.tokenService.deletePasswordResetToken(token);

    // Revoke all existing tokens
    await this.tokenService.revokeAllUserTokens(user.id);

    // Log password change
    await this.auditService.logPasswordChange(user.id, ipAddress, userAgent);
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all existing tokens
    await this.tokenService.revokeAllUserTokens(userId);

    // Log password change
    await this.auditService.logPasswordChange(userId, ipAddress, userAgent);
  }

  /**
   * Verify email
   */
  async verifyEmail(
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Verify token
    const email =
      await this.tokenService.verifyEmailVerificationToken(token);

    if (!email) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update email verified status
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Delete verification token
    await this.tokenService.deleteEmailVerificationToken(token);

    // Log email verification
    await this.auditService.logEmailVerified(user.id, ipAddress, userAgent);
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TwoFactorSecret> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication already enabled');
    }

    // Generate secret
    const secret = await this.twoFactorService.generateSecret(user.email);

    // Store secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.secret },
    });

    return secret;
  }

  /**
   * Verify and activate two-factor authentication
   */
  async verifyAndEnableTwoFactor(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication not initiated');
    }

    // Verify token
    const isValid = this.twoFactorService.verifyToken(
      user.twoFactorSecret,
      token,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Enable two-factor authentication
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Log two-factor enabled
    await this.auditService.logTwoFactorEnabled(userId, ipAddress, userAgent);
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication not enabled');
    }

    // Verify token
    const isValid = this.twoFactorService.verifyToken(
      user.twoFactorSecret,
      token,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Disable two-factor authentication
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Log two-factor disabled
    await this.auditService.logTwoFactorDisabled(userId, ipAddress, userAgent);
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }

  /**
   * Validate user by ID
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
