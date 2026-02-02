# StreamForge

**Distributed Event Streaming & Real-Time Data Platform**

A cloud-native event streaming platform similar to Kafka + AWS EventBridge + Confluent Cloud, built with modern technologies.

## Architecture

- **Backend**: NestJS + PostgreSQL + Redis Streams
- **Frontend**: Next.js 14 (App Router) + shadcn/ui
- **Infrastructure**: Docker Compose for local development

## Features (Foundation 0-20%)

✅ User authentication (JWT)
✅ Workspace management
✅ Topic creation and management
✅ Event publishing to Redis Streams
✅ Event consumption from Redis Streams
✅ API key generation and management

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd StreamForge
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start Docker services (PostgreSQL, Redis):
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

6. Start development servers:
```bash
# Terminal 1: Backend API
cd apps/api
pnpm dev

# Terminal 2: Frontend
cd apps/web
pnpm dev
```

7. Open your browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Redis Commander: http://localhost:8081

## Project Structure

```
StreamForge/
├── apps/
│   ├── api/          # NestJS Backend
│   └── web/          # Next.js Frontend
├── packages/
│   └── shared/       # Shared TypeScript types
└── docker-compose.yml
```

## Development

### Backend (apps/api)
```bash
cd apps/api
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm prisma studio # Open Prisma Studio
```

### Frontend (apps/web)
```bash
cd apps/web
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
```

## Testing the Platform

1. **Register**: Create a new account at `/register`
2. **Login**: Sign in to receive a JWT token
3. **Create Topic**: Navigate to Topics and create a new topic
4. **Publish Event**: Send an event to your topic
5. **Consume Events**: View events from your topic
6. **API Keys**: Generate API keys for programmatic access

## Tech Stack

### Backend
- NestJS - Enterprise Node.js framework
- PostgreSQL - Primary database
- Redis Streams - Message broker
- Prisma - Type-safe ORM
- Passport JWT - Authentication

### Frontend
- Next.js 14 - React framework with App Router
- shadcn/ui - UI component library
- Tailwind CSS - Utility-first CSS
- Zustand - State management
- Axios - HTTP client

## Roadmap

- [x] Phase 0-20%: Foundation (Auth, Topics, Publish/Consume)
- [ ] Phase 20-40%: Streaming Core (Partitions, Consumer Groups, Offsets)
- [ ] Phase 40-60%: Reliability (DLQ, Retry, Backpressure)
- [ ] Phase 60-80%: Enterprise (Webhooks, Schema Registry, ACLs)
- [ ] Phase 80-100%: Advanced (Live Monitoring, Replay, Metrics)

## License

MIT
