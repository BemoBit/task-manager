import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { ApiKeyService } from './services/api-key.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ChangePasswordDto,
  EnableTwoFactorDto,
  VerifyTwoFactorDto,
  DisableTwoFactorDto,
  UpdateProfileDto,
  VerifyEmailDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from './guards';
import { CurrentUser, Public, IpAddress, UserAgent, Roles } from './decorators';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 204,
    description: 'User successfully logged out',
  })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() body: { accessToken: string; refreshToken: string },
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    await this.authService.logout(
      userId,
      body.accessToken,
      body.refreshToken,
      ipAddress,
      userAgent,
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    return this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      ipAddress,
      userAgent,
    );
  }

  @Public()
  @Post('password/request-reset')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 2, ttl: 300000 } }) // 2 requests per 5 minutes
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (if user exists)',
  })
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    await this.authService.requestPasswordReset(
      requestPasswordResetDto.email,
      ipAddress,
      userAgent,
    );
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
      ipAddress,
      userAgent,
    );
    return { message: 'Password successfully reset' };
  }

  @Post('password/change')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    await this.authService.changePassword(
      userId,
      changePasswordDto,
      ipAddress,
      userAgent,
    );
    return { message: 'Password successfully changed' };
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    await this.authService.verifyEmail(
      verifyEmailDto.token,
      ipAddress,
      userAgent,
    );
    return { message: 'Email successfully verified' };
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret' })
  @ApiResponse({
    status: 200,
    description: 'Two-factor authentication secret generated',
  })
  async enableTwoFactor(
    @CurrentUser('id') userId: string,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    return this.authService.enableTwoFactor(userId, ipAddress, userAgent);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and activate 2FA' })
  @ApiResponse({
    status: 200,
    description: 'Two-factor authentication enabled',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid verification code',
  })
  async verifyAndEnableTwoFactor(
    @CurrentUser('id') userId: string,
    @Body() verifyTwoFactorDto: VerifyTwoFactorDto,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    await this.authService.verifyAndEnableTwoFactor(
      userId,
      verifyTwoFactorDto.token,
      ipAddress,
      userAgent,
    );
    return { message: 'Two-factor authentication enabled' };
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({
    status: 200,
    description: 'Two-factor authentication disabled',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid verification code',
  })
  async disableTwoFactor(
    @CurrentUser('id') userId: string,
    @Body() disableTwoFactorDto: DisableTwoFactorDto,
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    await this.authService.disableTwoFactor(
      userId,
      disableTwoFactorDto.token,
      ipAddress,
      userAgent,
    );
    return { message: 'Two-factor authentication disabled' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
  })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile successfully updated',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, updateProfileDto);
  }

  @Get('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiResponse({
    status: 200,
    description: 'API keys retrieved',
  })
  async getApiKeys(@CurrentUser('id') userId: string) {
    return this.apiKeyService.getUserApiKeys(userId);
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new API key' })
  @ApiResponse({
    status: 201,
    description: 'API key created',
  })
  async createApiKey(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string; expiresInDays?: number },
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    return this.apiKeyService.createApiKey(
      userId,
      body.name,
      body.expiresInDays,
      ipAddress,
      userAgent,
    );
  }

  @Post('api-keys/:keyId/revoke')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke API key' })
  @ApiResponse({
    status: 200,
    description: 'API key revoked',
  })
  async revokeApiKey(
    @CurrentUser('id') userId: string,
    @Body() body: { keyId: string },
    @IpAddress() ipAddress?: string,
    @UserAgent() userAgent?: string,
  ) {
    await this.apiKeyService.revokeApiKey(
      body.keyId,
      userId,
      ipAddress,
      userAgent,
    );
    return { message: 'API key revoked' };
  }
}
