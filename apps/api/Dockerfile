# Build stage (use Alpine for smaller image)
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma (Alpine uses musl by default, Prisma detects this automatically)
# DO NOT install libc6-compat as it prevents Prisma from running
RUN apk add --no-cache openssl openssl-dev

# Install pnpm
RUN npm install -g pnpm@9.15.4

# Set working directory
WORKDIR /app

# Copy package files and .npmrc
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Remove stale package-level Prisma client (critical for pnpm workspaces)
RUN rm -rf apps/api/node_modules/@prisma apps/api/node_modules/.prisma

# Recreate node_modules with new hoisting pattern and regenerate Prisma
RUN rm -rf node_modules
RUN pnpm install --frozen-lockfile

# Generate Prisma client (will be hoisted to root node_modules by pnpm)
RUN cd apps/api && npx prisma generate --schema=./prisma/schema.prisma

# Build the application from ROOT using filter
RUN pnpm --filter @streamforge/api build

# Production stage - Use Debian-based image for better compatibility
FROM node:20-slim

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9.15.4

WORKDIR /app

# Copy package files and .npmrc
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Remove stale package-level Prisma client in production stage too
RUN rm -rf apps/api/node_modules/@prisma apps/api/node_modules/.prisma

# Copy built application, Prisma schema, and generated client from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared ./packages/shared
# Copy Prisma generated client from pnpm store (content-addressable storage)
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

WORKDIR /app/apps/api

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main.js"]
