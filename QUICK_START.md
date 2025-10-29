# 🚀 Quick Start Guide - AI-Powered Task Manager Backend

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 20+ installed (`node --version`)
- ✅ Docker & Docker Compose installed (for Docker setup)
- ✅ PostgreSQL 15+ and Redis 7+ (for local setup)

## Option 1: Docker Setup (Recommended) ⭐

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Run Setup Script
```bash
./setup.sh
```
Select option `1` for Docker setup.

### Step 3: Wait for Services
The script will:
- Copy `.env.example` to `.env`
- Start PostgreSQL, Redis, and Backend services
- Run database migrations
- Optionally seed the database

### Step 4: Verify Installation
```bash
# Check if services are running
docker-compose ps

# View backend logs
docker-compose logs -f backend
```

### Step 5: Access the Application
- **API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/health

## Option 2: Local Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Setup Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### Step 3: Start PostgreSQL and Redis
```bash
# macOS
brew services start postgresql@15
brew services start redis

# Linux
sudo systemctl start postgresql
sudo systemctl start redis
```

### Step 4: Setup Database
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

### Step 5: Start Development Server
```bash
npm run start:dev
```

### Step 6: Access the Application
- **API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/health

## Verify Installation

### Test Health Endpoint
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "status": "ok",
    "timestamp": "2025-10-29T...",
    "uptime": 123.45,
    "environment": "development"
  }
}
```

### Test API Documentation
Open browser: http://localhost:3001/api/docs

You should see the Swagger UI with API documentation.

## Common Commands

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart backend only
docker-compose restart backend

# Run migrations
docker-compose exec backend npm run prisma:migrate

# Open Prisma Studio
docker-compose --profile tools up -d prisma-studio
# Access at http://localhost:5555
```

### Development Commands
```bash
# Start with hot-reload
npm run start:dev

# Start in debug mode
npm run start:debug

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Format code
npm run format

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Database Commands
```bash
# Generate Prisma Client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run prisma:seed

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### Port Already in Use
If port 3001, 5432, or 6379 is already in use:

**Option 1**: Stop existing services
```bash
# Stop Docker services
docker-compose down

# Or kill specific port (macOS/Linux)
lsof -ti:3001 | xargs kill -9
```

**Option 2**: Change ports in `.env` and `docker-compose.yml`

### Database Connection Error
1. Verify PostgreSQL is running:
   ```bash
   # Docker
   docker-compose ps postgres
   
   # Local
   pg_isready
   ```

2. Check DATABASE_URL in `.env`:
   ```
   DATABASE_URL="postgresql://admin:password123@localhost:5432/taskmanager?schema=public"
   ```

3. Test connection:
   ```bash
   npm run prisma:studio
   ```

### Redis Connection Error
1. Verify Redis is running:
   ```bash
   # Docker
   docker-compose ps redis
   
   # Local
   redis-cli ping
   # Should return: PONG
   ```

2. Check Redis config in `.env`:
   ```
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

### Prisma Generate Error
```bash
# Clean and regenerate
rm -rf node_modules/.prisma
npm run prisma:generate
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Configuration

### Important Environment Variables

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://admin:password123@localhost:5432/taskmanager

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (Change in production!)
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m

# AI Providers (Add your API keys)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

## API Testing with cURL

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Detailed Health Check
```bash
curl http://localhost:3001/api/health/detailed
```

## Next Steps

1. ✅ Verify all services are running
2. ✅ Check API documentation at `/api/docs`
3. ✅ Test health endpoints
4. 📖 Review the [README.md](backend/README.md) for detailed documentation
5. 📖 Check [BACKEND_STATUS.md](BACKEND_STATUS.md) for implementation status
6. 🚀 Start implementing authentication (Prompt 1.2)

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f` or `npm run start:dev`
2. Verify all prerequisites are installed
3. Ensure ports are not in use
4. Check environment variables in `.env`
5. Review the troubleshooting section above

## Production Deployment

For production deployment:
```bash
# Build production image
docker build -t task-manager-backend --target production .

# Run with production environment
docker run -p 3001:3001 \
  -e DATABASE_URL=your-production-db-url \
  -e REDIS_HOST=your-redis-host \
  -e JWT_SECRET=your-strong-secret \
  task-manager-backend
```

---

**Ready to go!** 🎉

The backend is now set up and running. Access the API documentation to explore available endpoints.
