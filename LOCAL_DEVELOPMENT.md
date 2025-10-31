# 🚀 Local Development Guide

Quick guide to run the TaskManager project locally using Docker.

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **Git** (to clone the repository)

That's it! Everything else is handled automatically.

## ⚡ Quick Start (First Time Setup)

```bash
# 1. Clone the repository (if you haven't already)
git clone <your-repo-url>
cd task-manager

# 2. Start everything with one command
./dev.sh
```

The script will automatically:
- ✅ Create environment configuration
- ✅ Build Docker containers
- ✅ Start PostgreSQL database
- ✅ Start Redis cache
- ✅ Start backend API (NestJS)
- ✅ Start frontend (Next.js)
- ✅ Run database migrations
- ✅ Wait for all services to be healthy

**First-time setup takes 3-5 minutes. Subsequent starts take 30-60 seconds.**

## 🌐 Access Your Application

Once the script completes, access your application at these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| 🎨 **Frontend** | http://localhost:3000 | Next.js application |
| 🔧 **Backend API** | http://localhost:3001/api | NestJS REST API |
| 📚 **API Documentation** | http://localhost:3001/api/docs | Interactive Swagger docs |
| 🗄️ **Prisma Studio** | http://localhost:5555 | Database management UI* |

*Prisma Studio requires running: `docker-compose --profile tools up prisma-studio`

## 🔄 Daily Development

### Start the Project

```bash
./dev.sh
```

### Stop the Project

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart a Specific Service

```bash
docker-compose restart backend
docker-compose restart frontend
```

## 🗃️ Database Management

### Access Prisma Studio (GUI)

```bash
docker-compose --profile tools up prisma-studio
```

Then visit: http://localhost:5555

### Access PostgreSQL CLI

```bash
docker-compose exec postgres psql -U admin -d taskmanager
```

### Run Database Migrations

```bash
docker-compose exec backend npm run prisma:migrate
```

### Reset Database (⚠️ Deletes all data)

```bash
docker-compose exec backend npx prisma migrate reset
```

### Seed Database with Sample Data

```bash
docker-compose exec backend npm run prisma:seed
```

## 🔧 Advanced Commands

### Rebuild Containers (after dependency changes)

```bash
docker-compose up -d --build
```

### Execute Commands in Backend

```bash
# Run tests
docker-compose exec backend npm run test

# Run linter
docker-compose exec backend npm run lint

# Install new package
docker-compose exec backend npm install <package-name>
```

### Execute Commands in Frontend

```bash
# Run linter
docker-compose exec frontend npm run lint

# Install new package
docker-compose exec frontend npm install <package-name>
```

### Access Container Shell

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec postgres sh
```

## 🐛 Troubleshooting

### Port Already in Use

If you get an error about ports being in use:

```bash
# Stop all Docker containers
docker-compose down

# Check what's using the port (example for port 3000)
lsof -ti:3000 | xargs kill -9

# Try again
./dev.sh
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs -f frontend

# Restart frontend
docker-compose restart frontend
```

### Backend Not Responding

```bash
# Check backend logs
docker-compose logs -f backend

# Check if database is running
docker-compose ps postgres

# Restart backend
docker-compose restart backend
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify database is healthy
docker-compose ps

# Restart database (will not lose data)
docker-compose restart postgres
```

### Reset Everything (⚠️ Nuclear Option)

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove Docker images
docker-compose rm -f

# Start fresh
./dev.sh
```

## 📝 Environment Variables

The project uses a `.env` file for configuration. Default values work for local development.

### Edit Configuration

```bash
# Edit the .env file
nano .env
# or
code .env
```

### Default Values

```env
DB_PASSWORD=password123
REDIS_PASSWORD=
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
```

### After Changing .env

```bash
# Restart services to pick up changes
docker-compose down
./dev.sh
```

## 🎨 Development Workflow

### Typical Development Flow

1. **Start the project**: `./dev.sh`
2. **Make code changes** in your editor
3. **Changes auto-reload**:
   - Frontend: Hot Module Replacement (instant)
   - Backend: Automatic restart on file change
4. **View changes** at http://localhost:3000
5. **Check logs** if needed: `docker-compose logs -f`
6. **Stop when done**: `docker-compose down`

### Working with Multiple Terminals

**Terminal 1** - Main logs:
```bash
docker-compose logs -f
```

**Terminal 2** - Run commands:
```bash
docker-compose exec backend npm run test
```

**Terminal 3** - Frontend specific:
```bash
docker-compose logs -f frontend
```

## 📦 Project Structure

```
task-manager/
├── backend/              # NestJS backend
│   ├── src/             # Source code
│   ├── prisma/          # Database schema & migrations
│   └── Dockerfile       # Backend Docker config
├── frontend/            # Next.js frontend
│   ├── src/            # Source code
│   └── Dockerfile.dev  # Frontend Docker config
├── docker-compose.yml   # Main Docker orchestration
├── dev.sh              # Quick start script
├── .env                # Environment variables
└── .env.example        # Environment template
```

## 🔒 Security Notes

- The default passwords are for **local development only**
- **Never** commit `.env` file to git (it's in `.gitignore`)
- Change all secrets before deploying to production
- Use `.env.example` as a template for production environments

## 🚀 Production Deployment

For production deployment, see:
- [DEVOPS_GUIDE.md](DEVOPS_GUIDE.md) - Complete deployment guide
- [DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md) - Infrastructure setup
- Production uses separate Docker configurations and Kubernetes

## 💡 Tips

1. **Save Resources**: Stop containers when not developing
   ```bash
   docker-compose down
   ```

2. **Fast Restart**: Services remember state
   ```bash
   docker-compose restart backend  # Quick restart
   ```

3. **Clean Start**: Remove containers but keep data
   ```bash
   docker-compose down
   ./dev.sh
   ```

4. **Monitor Resources**: Check Docker Desktop dashboard for CPU/memory usage

5. **VS Code Integration**: Use Docker extension to view and manage containers

## 📞 Getting Help

- **Check logs first**: `docker-compose logs -f`
- **Restart services**: `docker-compose restart <service>`
- **Review documentation**: Check `backend/README.md` and `DEVOPS_GUIDE.md`
- **Database issues**: Try `docker-compose restart postgres`
- **Clean slate**: `docker-compose down -v && ./dev.sh`

---

**Happy Coding! 🎉**

Need more details? Check out the [full documentation](README.md) or [DevOps guide](DEVOPS_GUIDE.md).
