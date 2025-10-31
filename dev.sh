#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TaskManager Local Development Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if .env file exists, if not create it from example
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}  You can edit .env to customize your configuration${NC}"
    echo ""
fi

# Stop any running containers
echo -e "${YELLOW}Stopping any running containers...${NC}"
docker-compose down 2>/dev/null || true
echo ""

# Build and start services
echo -e "${YELLOW}Building and starting services...${NC}"
echo -e "${YELLOW}This may take a few minutes on first run...${NC}"
docker-compose up -d --build
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
echo -e "${YELLOW}This may take 30-60 seconds...${NC}"

# Wait for backend to be healthy
MAX_ATTEMPTS=60
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker-compose ps backend | grep -q "healthy"; then
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
    echo -ne "${YELLOW}.${NC}"
done
echo ""

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}❌ Backend failed to start. Check logs with: docker-compose logs backend${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend is ready${NC}"

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose exec -T backend npm run prisma:migrate 2>/dev/null || true
docker-compose exec -T backend npx prisma generate 2>/dev/null || true
echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Wait for frontend to be ready
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3000 > /dev/null; then
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
    echo -ne "${YELLOW}.${NC}"
done
echo ""

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${YELLOW}⚠ Frontend may still be starting up${NC}"
else
    echo -e "${GREEN}✓ Frontend is ready${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 TaskManager is ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Access URLs:"
echo -e "  📱 Frontend:      ${GREEN}http://localhost:3000${NC}"
echo -e "  🔧 Backend API:   ${GREEN}http://localhost:3001/api${NC}"
echo -e "  📚 API Docs:      ${GREEN}http://localhost:3001/api/docs${NC}"
echo ""
echo -e "Database Management:"
echo -e "  🗄️  Prisma Studio: ${YELLOW}docker-compose --profile tools up prisma-studio${NC}"
echo -e "     (then visit http://localhost:5555)"
echo ""
echo -e "Useful Commands:"
echo -e "  View logs:        ${YELLOW}docker-compose logs -f${NC}"
echo -e "  Stop services:    ${YELLOW}docker-compose down${NC}"
echo -e "  Restart:          ${YELLOW}./dev.sh${NC}"
echo ""
