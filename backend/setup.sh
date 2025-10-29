#!/bin/bash

# AI-Powered Task Manager - Backend Setup Script
# This script automates the setup process for the backend

set -e  # Exit on error

echo "🚀 Starting AI-Powered Task Manager Backend Setup..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Determine setup method
echo "Select setup method:"
echo "1. Docker (Recommended - includes PostgreSQL and Redis)"
echo "2. Local (Requires local PostgreSQL and Redis)"
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
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your configuration before starting the services${NC}"
        echo ""
    fi
    
    # Start Docker services
    echo "🐳 Starting Docker services..."
    docker-compose up -d
    echo ""
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready (this may take a minute)..."
    sleep 30
    
    # Check if services are running
    echo "🔍 Checking service status..."
    docker-compose ps
    echo ""
    
    # Run migrations
    echo "🗄️  Running database migrations..."
    docker-compose exec -T backend npm run prisma:migrate
    echo ""
    
    # Optional: Seed database
    read -p "Do you want to seed the database with sample data? (y/n): " seed_choice
    if [ "$seed_choice" == "y" ] || [ "$seed_choice" == "Y" ]; then
        echo "🌱 Seeding database..."
        docker-compose exec -T backend npm run prisma:seed
        echo ""
    fi
    
    echo -e "${GREEN}✅ Docker setup complete!${NC}"
    echo ""
    echo "📚 Access points:"
    echo "   - API: http://localhost:3001/api"
    echo "   - API Docs: http://localhost:3001/api/docs"
    echo "   - Health Check: http://localhost:3001/api/health"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   - View logs: docker-compose logs -f backend"
    echo "   - Stop services: docker-compose down"
    echo "   - Restart services: docker-compose restart"
    echo "   - Open Prisma Studio: docker-compose --profile tools up prisma-studio"
    
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
    
    echo -e "${GREEN}✅ Local setup complete!${NC}"
    echo ""
    echo "🚀 Start the development server:"
    echo "   npm run start:dev"
    echo ""
    echo "📚 Once started, access points will be:"
    echo "   - API: http://localhost:3001/api"
    echo "   - API Docs: http://localhost:3001/api/docs"
    echo "   - Health Check: http://localhost:3001/api/health"
    
else
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
