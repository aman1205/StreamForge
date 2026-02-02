# StreamForge Setup Guide

## What We've Built

StreamForge Foundation (0-20%) - A fully functional distributed event streaming platform with:

### Backend (NestJS)
- ✅ User authentication with JWT
- ✅ Workspace management (multi-tenant)
- ✅ Topic CRUD operations
- ✅ Event publishing to Redis Streams
- ✅ Event consumption from Redis Streams
- ✅ API key generation and management

### Frontend (Next.js)
- ✅ Login and registration pages
- ✅ Dashboard with stats overview
- ✅ Topics management page
- ✅ Modern UI with shadcn/ui components

### Infrastructure
- ✅ PostgreSQL database
- ✅ Redis Streams for message broker
- ✅ Redis Commander for debugging
- ✅ Docker Compose configuration

## Quick Start

### Prerequisites Installed ✅
- Docker & Docker Compose
- Node.js 18+
- pnpm (via npx)

### Services Already Running ✅
- PostgreSQL (port 5432)
- Redis (port 6379)
- Redis Commander (http://localhost:8081)

### Database Schema Created ✅

## Start the Application

### Terminal 1: Start Backend API
```bash
cd apps/api
npx pnpm dev
```

The API will start on **http://localhost:3001**

### Terminal 2: Start Frontend
```bash
cd apps/web
npx pnpm dev
```

The web app will start on **http://localhost:3000**

## Test the Platform

1. **Register a New Account**
   - Open http://localhost:3000
   - You'll be redirected to `/login`
   - Click "Sign up" and create an account
   - A default workspace will be created automatically

2. **Create a Topic**
   - Navigate to "Topics" in the sidebar
   - Click "Create Topic"
   - Name: `user-events`
   - Partitions: 1
   - Click "Create Topic"

3. **Publish an Event** (via API)
   ```bash
   # Get your auth token from browser DevTools > Application > Local Storage > auth-storage

   curl -X POST http://localhost:3001/api/topics/[TOPIC_ID]/publish \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "payload": {
         "userId": "123",
         "action": "signup",
         "timestamp": "2024-01-31T10:00:00Z"
       }
     }'
   ```

4. **Consume Events** (via API)
   ```bash
   curl http://localhost:3001/api/topics/[TOPIC_ID]/consume \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

5. **View Redis Streams**
   - Open http://localhost:8081 (Redis Commander)
   - Browse keys matching `topic:*:partition:*`
   - See your published events in real-time

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Workspaces
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details

### Topics
- `GET /api/workspaces/:workspaceId/topics` - List topics
- `POST /api/workspaces/:workspaceId/topics` - Create topic
- `GET /api/topics/:id` - Get topic details
- `DELETE /api/topics/:id` - Delete topic

### Events
- `POST /api/topics/:topicId/publish` - Publish event
- `GET /api/topics/:topicId/consume` - Consume events

### API Keys
- `GET /api/workspaces/:workspaceId/api-keys` - List API keys
- `POST /api/workspaces/:workspaceId/api-keys` - Create API key
- `DELETE /api/api-keys/:id` - Delete API key

## Project Structure

```
StreamForge/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/       # JWT authentication
│   │   │   ├── workspaces/ # Workspace management
│   │   │   ├── topics/     # Topic CRUD
│   │   │   ├── events/     # Publish/Consume
│   │   │   ├── api-keys/   # API key management
│   │   │   └── common/     # Shared services
│   │   └── prisma/         # Database schema
│   │
│   └── web/                 # Next.js Frontend
│       ├── src/app/        # App Router pages
│       │   ├── (auth)/     # Auth pages
│       │   └── (dashboard)/ # Dashboard pages
│       ├── src/components/ # React components
│       └── src/lib/        # API client, stores
│
├── packages/
│   └── shared/             # Shared TypeScript types
│
└── docker-compose.yml      # Infrastructure
```

## Next Steps (20-100%)

### Phase 20-40%: Streaming Core
- [ ] Implement consumer groups
- [ ] Offset tracking and management
- [ ] Multi-partition support
- [ ] Load balancing across consumers

### Phase 40-60%: Reliability
- [ ] Dead Letter Queue (DLQ)
- [ ] Retry mechanism
- [ ] Message acknowledgment
- [ ] Backpressure handling

### Phase 60-80%: Enterprise
- [ ] Webhook producers
- [ ] JSON Schema validation
- [ ] Per-topic ACLs
- [ ] Audit logs and metrics

### Phase 80-100%: Advanced
- [ ] WebSocket live event feed
- [ ] Event replay UI
- [ ] Consumer lag tracking
- [ ] Real-time throughput graphs

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :3001  # Windows
lsof -i :3001  # Mac/Linux

# Stop Docker services if needed
docker-compose down
```

### Database Connection Issues
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs streamforge-postgres

# Restart if needed
docker-compose restart postgres
```

### Redis Connection Issues
```bash
# Verify Redis is running
docker ps | grep redis

# Test connection
docker exec streamforge-redis redis-cli ping

# Should return: PONG
```

## Development Tips

- Use Redis Commander (http://localhost:8081) to inspect Redis Streams
- Backend API docs: http://localhost:3001/api
- Frontend runs with hot reload
- Backend runs with watch mode (auto-restart on changes)

## Built With

- **Backend**: NestJS, Prisma, Redis (ioredis), JWT
- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui, Zustand
- **Database**: PostgreSQL 16
- **Message Broker**: Redis 7 Streams
- **Deployment**: Docker Compose

---

🎉 **StreamForge Foundation is ready to use!**

Start building real-time event-driven applications with a production-ready streaming platform.
