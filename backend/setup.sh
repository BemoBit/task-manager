#!/bin/bash

# AI-Powered Task Manager - Complete Backend Setup Script
# This script automates the complete setup process including authentication

set -e  # Exit on error

echo "========================================="
echo "🚀 Task Manager - Complete Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm version: $(npm --version)${NC}"
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the backend directory.${NC}"
    exit 1
fi

# Determine setup method
echo -e "${BLUE}Select setup method:${NC}"
echo "1. Docker (Recommended - includes PostgreSQL and Redis)"
echo "2. Local (Requires local PostgreSQL and Redis)"
echo ""
read -p "Enter choice (1 or 2): " setup_choice

if [ "$setup_choice" == "1" ]; then
    # Docker setup
    echo ""
    echo "🐳 Setting up with Docker..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker version: $(docker --version)${NC}"
    echo -e "${GREEN}✅ Docker Compose version: $(docker-compose --version)${NC}"
    echo ""
    
    # Copy environment file
    if [ ! -f .env ]; then
        echo "📋 Creating .env file..."
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${YELLOW}⚠️  Please edit .env file with your configuration${NC}"
        else
            echo -e "${RED}❌ .env.example not found. Please create .env manually.${NC}"
            exit 1
        fi
        echo ""
    else
        echo -e "${GREEN}✅ .env file already exists${NC}"
        echo ""
    fi
    
    # Start Docker services (only PostgreSQL and Redis)
    echo "🐳 Starting Docker services (PostgreSQL & Redis)..."
    docker-compose up -d postgres redis
    echo ""
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    echo "🔍 Checking service status..."
    docker-compose ps postgres redis
    echo ""
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
        npm install
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✅ Dependencies already installed${NC}"
    fi
    echo ""
    
    # Generate Prisma Client
    echo "🔧 Generating Prisma Client..."
    npm run prisma:generate
    echo -e "${GREEN}✅ Prisma Client generated${NC}"
    echo ""
    
    # Run migrations
    echo "🗄️  Running database migrations..."
    npm run prisma:migrate dev
    echo -e "${GREEN}✅ Database migrations completed${NC}"
    echo ""
    
    # Optional: Seed database
    read -p "Do you want to seed the database with sample data? (y/n): " seed_choice
    if [ "$seed_choice" == "y" ] || [ "$seed_choice" == "Y" ]; then
        echo "🌱 Seeding database..."
        docker-compose exec -T backend npm run prisma:seed
        echo ""
    fi
    
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ Docker Setup Complete!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo -e "${BLUE}🎉 Your system is ready!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Start the development server:"
    echo "     ${GREEN}npm run start:dev${NC}"
    echo ""
    echo "  2. Access the API documentation:"
    echo "     ${GREEN}http://localhost:3001/api/docs${NC}"
    echo ""
    echo "  3. Test the authentication endpoints:"
    echo "     - Register: POST /api/auth/register"
    echo "     - Login: POST /api/auth/login"
    echo "     - Profile: GET /api/auth/profile"
    echo ""
    echo "📚 Documentation:"
    echo "   - API Docs: http://localhost:3001/api/docs"
    echo "   - Auth README: src/modules/auth/README.md"
    echo "   - Setup Guide: src/modules/auth/SETUP.md"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Stop services: docker-compose down"
    echo "   - Restart services: docker-compose restart"
    echo "   - Open Prisma Studio: npm run prisma:studio"
    echo ""
    echo "🧪 Run tests:"
    echo "   npm run test:e2e test/auth.e2e-spec.ts"
    
elif [ "$setup_choice" == "2" ]; then
    # Local setup
    echo ""
    echo "💻 Setting up locally..."
    echo ""
    
    # Check for PostgreSQL
    if ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}⚠️  PostgreSQL not found. You'll need to install it manually.${NC}"
        echo "   macOS: brew install postgresql@15"
        echo "   Ubuntu: sudo apt install postgresql-15"
    else
        echo -e "${GREEN}✅ PostgreSQL found${NC}"
    fi
    
    # Check for Redis
    if ! command -v redis-cli &> /dev/null; then
        echo -e "${YELLOW}⚠️  Redis not found. You'll need to install it manually.${NC}"
        echo "   macOS: brew install redis"
        echo "   Ubuntu: sudo apt install redis"
    else
        echo -e "${GREEN}✅ Redis found${NC}"
    fi
    echo ""
    
    # Copy environment file
    if [ ! -f .env ]; then
        echo "📋 Creating .env file..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your database credentials${NC}"
        read -p "Press enter to continue after editing .env..."
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    echo ""
    
    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    npm run prisma:generate
    echo ""
    
    # Run migrations
    echo "🗄️  Running database migrations..."
    npm run prisma:migrate
    echo ""
    
    # Optional: Seed database
    read -p "Do you want to seed the database with sample data? (y/n): " seed_choice
    if [ "$seed_choice" == "y" ] || [ "$seed_choice" == "Y" ]; then
        echo "🌱 Seeding database..."
        npm run prisma:seed
        echo ""
    fi
    
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ Local Setup Complete!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo -e "${BLUE}🎉 Your system is ready!${NC}"
    echo ""
    echo "� Next steps:"
    echo "  1. Start the development server:"
    echo "     ${GREEN}npm run start:dev${NC}"
    echo ""
    echo "  2. Access the API documentation:"
    echo "     ${GREEN}http://localhost:3001/api/docs${NC}"
    echo ""
    echo "  3. Test the authentication endpoints:"
    echo "     - Register: POST /api/auth/register"
    echo "     - Login: POST /api/auth/login"
    echo "     - Profile: GET /api/auth/profile"
    echo ""
    echo "📚 Documentation:"
    echo "   - API Docs: http://localhost:3001/api/docs"
    echo "   - Auth README: src/modules/auth/README.md"
    echo "   - Setup Guide: src/modules/auth/SETUP.md"
    echo ""
    echo "🧪 Run tests:"
    echo "   npm run test:e2e test/auth.e2e-spec.ts"
    
else
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
