# Build stage
FROM node:20-alpine AS builder

RUN npm install -g pnpm@8.15.0
WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN pnpm build

# Production stage
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@8.15.0

COPY --from=builder /app/apps/web ./

EXPOSE 3000
CMD ["pnpm", "start"]
