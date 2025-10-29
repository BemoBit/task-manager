import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import {
  AuthService,
  TokenService,
  TwoFactorService,
  ApiKeyService,
  AuditService,
  BruteForceProtectionService,
} from './services';
import { JwtStrategy, RefreshTokenStrategy } from './strategies';
import { JwtAuthGuard, RolesGuard, ApiKeyGuard } from './guards';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
        },
      }),
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    TwoFactorService,
    ApiKeyService,
    AuditService,
    BruteForceProtectionService,
    JwtStrategy,
    RefreshTokenStrategy,
    JwtAuthGuard,
    RolesGuard,
    ApiKeyGuard,
    // Make JwtAuthGuard the default guard for all routes
    // Use @Public() decorator to make a route public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [
    AuthService,
    TokenService,
    ApiKeyService,
    JwtAuthGuard,
    RolesGuard,
    ApiKeyGuard,
  ],
})
export class AuthModule {}
