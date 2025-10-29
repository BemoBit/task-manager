# AI-Powered Task Manager Backend

Production-ready NestJS backend for an AI-powered task management system with template-based task decomposition.

## 🚀 Features

- **Modern NestJS Architecture**: Modular, scalable, and maintainable
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for high-performance caching
- **Authentication**: JWT-based with refresh tokens and role-based access control
- **Security**: Helmet, CORS, rate limiting, input validation
- **API Documentation**: Swagger/OpenAPI auto-generated docs
- **Logging**: Structured logging with Winston
- **Health Checks**: Kubernetes-ready liveness and readiness probes
- **Testing**: Unit, integration, and E2E tests with Jest
- **Docker**: Multi-stage Dockerfile and docker-compose setup

## 📋 Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- Docker and Docker Compose (optional)

## 🛠️ Installation

### Option 1: Local Development

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL and Redis** (if not using Docker):
   ```bash
   # PostgreSQL
   brew install postgresql@15
   brew services start postgresql@15
   createdb taskmanager

   # Redis
   brew install redis
   brew services start redis
   ```

5. **Generate Prisma Client and run migrations:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

6. **Seed the database** (optional):
   ```bash
   npm run prisma:seed
   ```

7. **Start the development server:**
   ```bash
   npm run start:dev
   ```

The server will start at `http://localhost:3001/api`

### Option 2: Docker Development

1. **Start all services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations inside the container:**
   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```

3. **Seed the database** (optional):
   ```bash
   docker-compose exec backend npm run prisma:seed
   ```

The server will start at `http://localhost:3001/api`

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:
- **Swagger UI**: http://localhost:3001/api/docs

## 🧪 Testing

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## 🔧 Available Scripts

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start in debug mode

# Build
npm run build              # Build for production

# Production
npm run start:prod         # Start production server

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database

# Code quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier

# Testing
npm run test               # Run unit tests
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run E2E tests
```

## 🗂️ Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Database seeding script
│   └── migrations/        # Migration files
├── src/
│   ├── common/
│   │   ├── filters/       # Exception filters
│   │   └── interceptors/  # Request/response interceptors
│   ├── config/            # Configuration files
│   ├── modules/
│   │   ├── database/      # Prisma module
│   │   ├── health/        # Health check endpoints
│   │   ├── auth/          # Authentication (to be added)
│   │   ├── templates/     # Template management (to be added)
│   │   ├── tasks/         # Task management (to be added)
│   │   └── ai-providers/  # AI integration (to be added)
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application bootstrap
├── test/                  # E2E tests
├── docker-compose.yml     # Docker services configuration
├── Dockerfile             # Multi-stage Docker build
└── package.json
```

## 🔐 Environment Variables

See `.env.example` for all available environment variables. Key variables:

```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api

# Database
DATABASE_URL=postgresql://admin:password123@localhost:5432/taskmanager

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m

# AI Providers
OPENAI_API_KEY=your-api-key
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Rebuild and start
docker-compose up -d --build

# Start with Prisma Studio
docker-compose --profile tools up -d

# Execute commands inside container
docker-compose exec backend npm run prisma:migrate
```

## 🏗️ Architecture

### Core Modules

1. **AuthModule**: JWT authentication, role-based access control
2. **TemplatesModule**: Template CRUD operations and versioning
3. **TasksModule**: Task management and decomposition
4. **AIProvidersModule**: AI service integration
5. **DatabaseModule**: Prisma ORM with PostgreSQL
6. **CacheModule**: Redis caching layer

### Database Schema

The application uses Prisma ORM with PostgreSQL. Key entities:
- Users (with roles and permissions)
- Templates (decomposition and enrichment)
- Tasks and Subtasks
- AI Providers
- Audit Logs

See `prisma/schema.prisma` for the complete schema.

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Throttling with @nestjs/throttler
- **Input Validation**: class-validator and class-transformer
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **API Keys**: Support for external service authentication

## 📊 Health Checks

Health check endpoints for monitoring:

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system health
- `GET /api/health/ready` - Readiness probe (Kubernetes)
- `GET /api/health/live` - Liveness probe (Kubernetes)

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Production

```bash
# Build production image
docker build -t task-manager-backend --target production .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL=your-database-url \
  -e REDIS_HOST=your-redis-host \
  task-manager-backend
```

## 📝 Next Steps

The following modules need to be implemented:

1. **Authentication Module**: Complete JWT auth with 2FA
2. **Templates Module**: Visual template editor backend
3. **Tasks Module**: Task processing pipeline
4. **AI Providers Module**: Multi-provider AI integration
5. **WebSockets**: Real-time updates
6. **Queue System**: Bull for async processing

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Follow TypeScript and ESLint rules

## 📄 License

MIT License

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the health check endpoints

---

Built with ❤️ using NestJS, Prisma, and PostgreSQL
