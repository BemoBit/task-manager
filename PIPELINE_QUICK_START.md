# Pipeline System Quick Start

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Services

#### Using Docker (Recommended)

```bash
docker-compose up -d postgres redis
```

#### Or Install Locally

```bash
# macOS
brew install postgresql redis
brew services start postgresql
brew services start redis

# Ubuntu/Debian
sudo apt install postgresql redis-server
sudo systemctl start postgresql redis-server
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Update `.env`:

```env
DATABASE_URL="postgresql://admin:password@localhost:5432/taskmanager"
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
```

### 4. Setup Database

```bash
# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 5. Start Application

```bash
npm run start:dev
```

The server will start at `http://localhost:3001`

## Testing the Pipeline

### 1. Create a Task

First, you need a task in the database. Use the Prisma Studio or API:

```bash
# Open Prisma Studio
npx prisma studio
```

Or use SQL:

```sql
-- Get a phase ID first
SELECT id FROM phases LIMIT 1;

-- Create a task
INSERT INTO tasks (id, title, description, phase_id)
VALUES (
  gen_random_uuid(),
  'Build User Authentication',
  'Implement JWT-based authentication with refresh tokens',
  '<phase-id-from-above>'
);
```

### 2. Start a Pipeline

```bash
curl -X POST http://localhost:3001/api/pipeline/start \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<your-task-id>",
    "techStack": ["NestJS", "TypeScript", "PostgreSQL", "Prisma"],
    "codingStandards": ["Clean Code", "SOLID"],
    "enableCheckpoints": true
  }'
```

Response:

```json
{
  "pipelineId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Pipeline started successfully"
}
```

### 3. Monitor Progress

#### Via REST API

```bash
# Get pipeline state
curl http://localhost:3001/api/pipeline/<pipeline-id>/state

# Get checkpoints
curl http://localhost:3001/api/pipeline/<pipeline-id>/checkpoints
```

#### Via WebSocket (Using Browser Console)

```javascript
// Open browser console at http://localhost:3001
const socket = io('http://localhost:3001/pipeline');

socket.on('connected', (data) => {
  console.log('Connected:', data);
  
  // Subscribe to pipeline
  socket.emit('subscribe', '<pipeline-id>');
});

socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data);
});

// Listen to all events
socket.on('pipeline-event', (event) => {
  console.log('Event:', event.type, event.data);
});

// Specific events
socket.on('pipeline-started', (e) => console.log('Started:', e));
socket.on('phase-completed', (e) => console.log('Phase done:', e));
socket.on('subtask-generated', (e) => console.log('Subtask:', e));
socket.on('pipeline-completed', (e) => console.log('Completed:', e));
```

### 4. View Results

```bash
# Get subtasks
curl http://localhost:3001/api/tasks/<task-id>/subtasks
```

Or use Prisma Studio:

```bash
npx prisma studio
# Navigate to Subtask table
```

## Pipeline Operations

### Pause Pipeline

```bash
curl -X PATCH http://localhost:3001/api/pipeline/pause \
  -H "Content-Type: application/json" \
  -d '{
    "pipelineId": "<pipeline-id>",
    "reason": "Need to review requirements"
  }'
```

### Resume Pipeline

```bash
curl -X PATCH http://localhost:3001/api/pipeline/resume \
  -H "Content-Type: application/json" \
  -d '{
    "pipelineId": "<pipeline-id>"
  }'
```

### Rollback to Checkpoint

```bash
curl -X POST http://localhost:3001/api/pipeline/rollback \
  -H "Content-Type: application/json" \
  -d '{
    "pipelineId": "<pipeline-id>",
    "checkpointId": "<checkpoint-id>",
    "reason": "Error in enrichment phase"
  }'
```

## Common Issues

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If not running
brew services start redis  # macOS
sudo systemctl start redis # Linux
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql -U admin -d taskmanager
# Should connect

# If not running
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
```

### Queue Not Processing

```bash
# Check application logs
npm run start:dev

# Look for:
# "Pipeline WebSocket Gateway initialized"
# "BullMQ queues registered"
```

## API Documentation

Once running, visit:

```
http://localhost:3001/api/docs
```

For interactive Swagger documentation.

## Next Steps

1. **Integrate AI Providers**: Connect OpenAI/Anthropic for actual task decomposition
2. **Add Authentication**: Implement JWT auth guards
3. **Create Frontend**: Build UI for pipeline visualization
4. **Template System**: Create reusable pipeline templates
5. **Monitoring**: Add Prometheus metrics and Grafana dashboards

## Development

### Run Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```

### Lint & Format

```bash
npm run lint
npm run format
```

### Build

```bash
npm run build
```

## Production Deployment

### 1. Build Docker Image

```bash
docker build -t task-manager-backend --target production .
```

### 2. Run with Docker Compose

```bash
docker-compose up -d
```

### 3. Environment Variables

Set in production:

```env
NODE_ENV=production
DATABASE_URL=<production-db-url>
REDIS_HOST=<production-redis-host>
JWT_SECRET=<strong-secret>
FRONTEND_URL=<production-frontend-url>
```

## Support

- Documentation: `/backend/src/modules/tasks/PIPELINE_DOCUMENTATION.md`
- API Docs: `http://localhost:3001/api/docs`
- Issues: Create an issue in the repository

---

Happy coding! 🚀
