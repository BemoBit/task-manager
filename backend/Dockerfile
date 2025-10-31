# Multi-stage Dockerfile for Production-ready NestJS Application

# Stage 1: Build Stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Set environment variables
ENV NODE_ENV=production

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]

# Stage 3: Development Stage
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Install development tools and OpenSSL for Prisma
RUN apk add --no-cache bash openssl openssl-dev

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose application port
EXPOSE 3001

# Start in development mode with hot-reload
CMD ["npm", "run", "start:dev"]
