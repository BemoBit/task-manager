# Authentication & Authorization Module

## 📋 Overview

Comprehensive authentication and authorization system for the NestJS backend with JWT-based authentication, role-based access control (RBAC), two-factor authentication (2FA), API key management, and advanced security features.

## ✨ Features

### 🔐 Core Authentication
- **JWT-based Authentication**: Access and refresh token mechanism
- **Password Security**: bcrypt hashing with salt rounds
- **Email Verification**: Token-based email verification
- **Password Reset**: Secure password reset flow with time-limited tokens
- **Session Management**: Redis-based session storage and JWT blacklisting
- **Token Rotation**: Automatic refresh token rotation on use

### 👥 User Management
- **User Registration**: Email and password-based registration
- **Profile Management**: Update user profile information
- **Account Status**: Active/inactive user accounts

### 🛡️ Authorization
- **Role-Based Access Control (RBAC)**: Admin, Manager, User roles
- **Custom Decorators**: `@Roles()`, `@CurrentUser()`, `@Public()`
- **Guard System**: JWT, Roles, and API Key guards

### 🔑 Two-Factor Authentication (2FA)
- **TOTP-based 2FA**: Time-based one-time passwords using speakeasy
- **QR Code Generation**: Easy setup with QR codes
- **Backup Codes**: Account recovery options

### 🔧 API Key Authentication
- **API Key Management**: Create, list, and revoke API keys
- **Expiration Support**: Optional expiration dates
- **Usage Tracking**: Last used timestamp tracking
- **Multiple Auth Methods**: Support for both JWT and API key authentication

### 🚨 Security Features
- **Brute Force Protection**: Login attempt tracking and account lockout
- **Rate Limiting**: Per-endpoint throttling
- **Token Blacklisting**: Invalidate tokens on logout
- **Audit Logging**: Comprehensive logging of all auth events
- **Password Policies**: Strong password requirements
- **Security Headers**: Helmet integration

## 🏗️ Architecture

```
auth/
├── decorators/          # Custom decorators
│   ├── current-user.decorator.ts
│   ├── ip-address.decorator.ts
│   ├── public.decorator.ts
│   ├── roles.decorator.ts
│   └── user-agent.decorator.ts
├── dto/                 # Data Transfer Objects
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── refresh-token.dto.ts
│   ├── reset-password.dto.ts
│   ├── change-password.dto.ts
│   ├── two-factor.dto.ts
│   ├── update-profile.dto.ts
│   └── verify-email.dto.ts
├── guards/              # Route guards
│   ├── jwt-auth.guard.ts
│   ├── refresh-token.guard.ts
│   ├── roles.guard.ts
│   └── api-key.guard.ts
├── interfaces/          # TypeScript interfaces
│   ├── jwt.interface.ts
│   └── two-factor.interface.ts
├── services/            # Business logic
│   ├── auth.service.ts
│   ├── token.service.ts
│   ├── two-factor.service.ts
│   ├── api-key.service.ts
│   ├── audit.service.ts
│   └── brute-force-protection.service.ts
├── strategies/          # Passport strategies
│   ├── jwt.strategy.ts
│   └── refresh-token.strategy.ts
├── auth.controller.ts   # API endpoints
└── auth.module.ts       # Module configuration
```

## 🚀 Usage

### Registration

```typescript
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd",
  "firstName": "John",
  "lastName": "Doe"
}

Response: 201 Created
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": false,
    "twoFactorEnabled": false
  }
}
```

### Login

```typescript
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd",
  "twoFactorCode": "123456" // Optional, required if 2FA is enabled
}

Response: 200 OK
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### Protected Routes

```typescript
GET /auth/profile
Authorization: Bearer <access-token>

Response: 200 OK
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "emailVerified": false,
  "twoFactorEnabled": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Refresh Token

```typescript
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: 200 OK
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### Two-Factor Authentication

#### Enable 2FA
```typescript
POST /auth/2fa/enable
Authorization: Bearer <access-token>

Response: 200 OK
{
  "secret": "JBSWY3DPEHPK3PXP",
  "otpAuthUrl": "otpauth://totp/TaskManager...",
  "qrCode": "data:image/png;base64,..."
}
```

#### Verify and Activate 2FA
```typescript
POST /auth/2fa/verify
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "token": "123456"
}

Response: 200 OK
{
  "message": "Two-factor authentication enabled"
}
```

#### Disable 2FA
```typescript
POST /auth/2fa/disable
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "token": "123456"
}

Response: 200 OK
{
  "message": "Two-factor authentication disabled"
}
```

### API Key Management

#### Create API Key
```typescript
POST /auth/api-keys
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Production API Key",
  "expiresInDays": 90
}

Response: 201 Created
{
  "id": "uuid",
  "key": "a1b2c3d4e5f6...",
  "name": "Production API Key",
  "expiresAt": "2025-04-01T00:00:00.000Z"
}
```

#### Use API Key
```typescript
// Method 1: Authorization header
GET /api/some-endpoint
Authorization: Bearer <api-key>

// Method 2: X-API-Key header
GET /api/some-endpoint
X-API-Key: <api-key>

// Method 3: Query parameter
GET /api/some-endpoint?apiKey=<api-key>
```

## 🔒 Security Configuration

### Password Policy

Passwords must meet the following requirements:
- Minimum 8 characters
- Maximum 32 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Brute Force Protection

- **Max Login Attempts**: 5 failed attempts
- **Lockout Duration**: 15 minutes
- **Attempt Window**: 5 minutes
- Tracking by email address
- Automatic lockout notification

### Rate Limiting

- **Registration**: 3 requests per minute
- **Login**: 5 requests per minute
- **Password Reset**: 2 requests per 5 minutes
- Per IP and user-based throttling

### Token Configuration

```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Session Management

- Access tokens: 15 minutes (configurable)
- Refresh tokens: 7 days (configurable)
- Automatic refresh token rotation
- JWT blacklisting on logout
- Redis-based token storage

## 🎯 Decorators

### @Public()
Mark routes as public (bypass authentication):
```typescript
@Public()
@Get('public-endpoint')
async publicRoute() {
  return { message: 'This is public' };
}
```

### @Roles()
Restrict access to specific roles:
```typescript
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Get('admin-only')
async adminRoute() {
  return { message: 'Admin only' };
}
```

### @CurrentUser()
Get the authenticated user:
```typescript
@Get('me')
async getMe(@CurrentUser() user) {
  return user;
}

// Get specific property
@Get('me')
async getMe(@CurrentUser('id') userId: string) {
  return { userId };
}
```

### @IpAddress()
Get client IP address:
```typescript
@Post('login')
async login(@IpAddress() ipAddress: string) {
  // Use ipAddress for logging
}
```

### @UserAgent()
Get client user agent:
```typescript
@Post('login')
async login(@UserAgent() userAgent: string) {
  // Use userAgent for logging
}
```

## 📊 Audit Logging

All authentication events are automatically logged:

- User registration
- Login attempts (success and failure)
- Logout
- Password changes
- Password reset requests
- Email verification
- 2FA enabled/disabled
- API key creation/revocation
- Token refresh

Audit logs include:
- User ID
- Action type
- Resource
- IP address
- User agent
- Timestamp
- Additional details (JSON)

## 🧪 Testing

### Run E2E Tests
```bash
npm run test:e2e test/auth.e2e-spec.ts
```

### Test Coverage
```bash
npm run test:cov
```

## 📝 Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-secret-key-minimum-32-characters-recommended
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 🔧 Integration

### Import AuthModule

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
```

### Use Guards

```typescript
// Global JWT protection (already configured)
// All routes are protected by default

// Make a route public
@Public()
@Get('public')
async publicRoute() {}

// Add role-based protection
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin')
async adminRoute() {}

// Use API key authentication
@UseGuards(ApiKeyGuard)
@Get('api-endpoint')
async apiRoute() {}
```

## 🐛 Troubleshooting

### "Invalid refresh token" error
- Refresh tokens are single-use (rotation)
- Check if token has been revoked
- Verify token hasn't expired

### "Account locked" error
- Wait 15 minutes or contact admin
- Too many failed login attempts
- Check brute force protection settings

### 2FA issues
- Ensure time sync on device
- Verify secret was saved correctly
- Check token window (±2 time steps)

### API key not working
- Check if key is active
- Verify expiration date
- Ensure proper header format

## 📚 Additional Resources

- [JWT Best Practices](https://jwt.io/introduction)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [Passport.js Documentation](http://www.passportjs.org/)

## 🤝 Contributing

When extending the authentication system:

1. Maintain security best practices
2. Add comprehensive tests
3. Update documentation
4. Log all security-relevant events
5. Follow existing patterns and conventions

## 📄 License

MIT License - See LICENSE file for details
