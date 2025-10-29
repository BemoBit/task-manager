# Authentication System - Setup Guide

This guide will help you set up and test the authentication system.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose (recommended)
- OR PostgreSQL 15+ and Redis 7+ (for local setup)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
```

### 3. Start Services with Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready (check with)
docker-compose ps
```

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

### 5. Set Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api

# Database
DATABASE_URL=postgresql://taskmanager:taskmanager_password@localhost:5432/taskmanager_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-recommended
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=10

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 6. Start the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001/api`

## Testing the Authentication System

### 1. Access API Documentation

Open your browser and navigate to:
```
http://localhost:3001/api/docs
```

This provides an interactive Swagger UI to test all endpoints.

### 2. Test with cURL

#### Register a New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "role": "USER",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": false,
    "twoFactorEnabled": false
  }
}
```

#### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

#### Get Profile

```bash
# Save the access token from registration/login
ACCESS_TOKEN="your-access-token-here"

curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Update Profile

```bash
curl -X PATCH http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

#### Change Password

```bash
curl -X POST http://localhost:3001/api/auth/password/change \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Test@1234",
    "newPassword": "NewTest@5678"
  }'
```

#### Enable Two-Factor Authentication

```bash
# Step 1: Generate 2FA secret and QR code
curl -X POST http://localhost:3001/api/auth/2fa/enable \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response includes QR code and secret. Scan QR code with authenticator app.

```bash
# Step 2: Verify and activate 2FA with code from authenticator app
curl -X POST http://localhost:3001/api/auth/2fa/verify \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

#### Create API Key

```bash
curl -X POST http://localhost:3001/api/auth/api-keys \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Key",
    "expiresInDays": 90
  }'
```

#### Use API Key

```bash
# Method 1: Authorization header
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer your-api-key-here"

# Method 2: X-API-Key header
curl -X GET http://localhost:3001/api/auth/profile \
  -H "X-API-Key: your-api-key-here"
```

#### Refresh Token

```bash
REFRESH_TOKEN="your-refresh-token-here"

curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'$REFRESH_TOKEN'"
  }'
```

#### Logout

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "'$ACCESS_TOKEN'",
    "refreshToken": "'$REFRESH_TOKEN'"
  }'
```

### 3. Run E2E Tests

```bash
# Run all auth tests
npm run test:e2e test/auth.e2e-spec.ts

# Run with coverage
npm run test:cov
```

## Postman Collection

Import the following collection into Postman for easier testing:

1. Create a new collection named "Task Manager Auth"
2. Add the following variables:
   - `baseUrl`: `http://localhost:3001/api`
   - `accessToken`: (will be set automatically)
   - `refreshToken`: (will be set automatically)

3. Add test scripts to automatically save tokens:

```javascript
// Add to Register and Login requests
pm.test("Save tokens", function () {
    var jsonData = pm.response.json();
    pm.collectionVariables.set("accessToken", jsonData.accessToken);
    pm.collectionVariables.set("refreshToken", jsonData.refreshToken);
});
```

## Monitoring and Debugging

### Check Logs

```bash
# View application logs
tail -f backend/logs/application.log

# View error logs
tail -f backend/logs/error.log
```

### Check Redis

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check all keys
KEYS *

# Check token blacklist
KEYS blacklist:*

# Check brute force attempts
KEYS auth:attempts:*

# Check account lockouts
KEYS auth:lockout:*
```

### Check Database

```bash
# Open Prisma Studio
npm run prisma:studio

# Or connect directly
docker-compose exec postgres psql -U taskmanager -d taskmanager_db

# Check users
SELECT id, email, role, "emailVerified", "twoFactorEnabled", "isActive" FROM users;

# Check refresh tokens
SELECT id, "userId", "isRevoked", "expiresAt" FROM refresh_tokens;

# Check API keys
SELECT id, name, "userId", "isActive", "lastUsedAt", "expiresAt" FROM api_keys;

# Check audit logs
SELECT id, action, resource, "userId", "ipAddress", "createdAt" FROM audit_logs ORDER BY "createdAt" DESC LIMIT 10;
```

## Common Issues and Solutions

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```bash
npm run prisma:generate
```

### Issue: "Connection refused" when starting app

**Solution:**
Make sure PostgreSQL and Redis are running:
```bash
docker-compose up -d postgres redis
docker-compose ps
```

### Issue: "Invalid refresh token"

**Solution:**
Refresh tokens are single-use. Get a new one by logging in again.

### Issue: "Account is temporarily locked"

**Solution:**
Wait 15 minutes or clear Redis:
```bash
docker-compose exec redis redis-cli FLUSHALL
```

### Issue: TypeScript errors

**Solution:**
```bash
npm install
npm run prisma:generate
```

## Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong, random value (min 32 characters)
- [ ] Use strong passwords for PostgreSQL and Redis
- [ ] Enable Redis authentication
- [ ] Use HTTPS in production
- [ ] Set appropriate `CORS_ORIGIN`
- [ ] Review rate limiting settings
- [ ] Enable database SSL connections
- [ ] Set up proper logging and monitoring
- [ ] Configure backup strategy
- [ ] Review and adjust brute force protection settings
- [ ] Set up alerts for suspicious activities

## Performance Tuning

### Redis Optimization

```env
# Adjust Redis configuration
REDIS_TTL=7200  # Increase cache TTL
```

### Database Connection Pooling

```env
# In DATABASE_URL
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10
```

### JWT Token Size

Keep JWT payloads minimal. Current implementation includes:
- User ID (sub)
- Email
- Role
- Issued at (iat)
- Expiration (exp)

## Next Steps

1. **Email Service Integration**: Implement actual email sending for:
   - Email verification
   - Password reset
   - Security alerts

2. **Admin Dashboard**: Create admin endpoints for:
   - User management
   - Audit log viewing
   - System monitoring

3. **Advanced Features**:
   - Social authentication (Google, GitHub, etc.)
   - Passwordless authentication
   - Biometric authentication support
   - Device management
   - Session management UI

4. **Security Enhancements**:
   - CAPTCHA integration
   - Advanced fraud detection
   - Geolocation-based access control
   - Device fingerprinting

## Support

If you encounter any issues:

1. Check the logs in `backend/logs/`
2. Review the API documentation at `/api/docs`
3. Check database state with Prisma Studio
4. Review Redis state with redis-cli
5. Consult the [Authentication README](./README.md)

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT.io](https://jwt.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
