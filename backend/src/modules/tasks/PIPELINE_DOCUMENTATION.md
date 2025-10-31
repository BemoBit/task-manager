# Task Processing Pipeline System

## Overview

A sophisticated, production-ready task processing pipeline system built with NestJS that decomposes complex tasks into structured subtasks using a phase-based execution model with state management, queue processing, and real-time updates.

## Architecture

### Core Components

1. **Pipeline Service** - Orchestrates the entire pipeline execution
2. **State Machine Service** - Manages state transitions with validation
3. **Queue Processors** - Handle asynchronous job processing (Pipeline, Decomposition, Enrichment)
4. **WebSocket Gateway** - Provides real-time updates to clients
5. **Pipeline Controller** - REST API endpoints for pipeline management

### Technology Stack

- **NestJS** - Backend framework
- **BullMQ** - Queue management with Redis
- **Socket.IO** - WebSocket communication
- **Prisma** - Database ORM
- **PostgreSQL** - Data persistence
- **Redis** - Queue backend and caching

## Features

### ✅ Implemented Features

- **Phase-Based Execution**: Three-phase pipeline (Decomposition → Enrichment → Prompt Generation)
- **State Machine**: Validated state transitions for pipeline and phases
- **Queue Management**: Priority queues with retry logic and dead letter queues
- **Checkpoints**: Save pipeline state at key points for recovery
- **Rollback**: Restore pipeline to previous checkpoints
- **Real-time Updates**: WebSocket events for pipeline progress
- **Error Handling**: Comprehensive error handling with retry strategies
- **Transaction Support**: Atomic operations for data consistency
- **Progress Tracking**: Detailed progress monitoring for each phase

## Pipeline Phases

### Phase 1: Task Decomposition

**Purpose**: Break down the main task into structured subtasks across different categories.

**Categories**:
- `DATA_MODEL` - Database schema and data structures
- `SERVICE` - Business logic and service layer
- `HTTP_API` - REST endpoints and API design
- `TESTING` - Unit tests, integration tests, E2E tests

**Process**:
1. Parse main task description
2. Apply decomposition template
3. Generate subtasks for each category
4. Validate subtask completeness
5. Store subtasks in database
6. Create checkpoint

**Output**: Array of SubtaskData objects with:
- Category
- Title & Description
- Requirements
- Dependencies
- Estimated effort
- Priority

### Phase 2: Task Enrichment

**Purpose**: Enhance subtasks with project-specific context, coding standards, and best practices.

**Enrichment Steps**:
1. Add tech stack specific requirements
2. Inject coding standards
3. Apply project rules
4. Include best practices per category
5. Update subtasks in database
6. Create checkpoint

**Enhancements**:
- **Tech Stack Requirements**: NestJS, TypeScript, PostgreSQL, Prisma specific guidelines
- **Coding Standards**: Clean code, SOLID principles, documentation
- **Best Practices**: Category-specific recommendations
- **Project Context**: Custom project rules and conventions

### Phase 3: Prompt Generation

**Purpose**: Generate implementation-ready prompts from enriched subtasks.

**Process**:
1. Group subtasks by category
2. Format prompts with context
3. Include tech stack details
4. Add coding standards
5. Generate comprehensive implementation guidelines

**Output**: Array of formatted prompts ready for AI or developers

## State Machine

### Pipeline States

```
IDLE → INITIALIZING → DECOMPOSING → ENRICHING → GENERATING_PROMPTS → COMPLETED
  ↓                        ↓              ↓                ↓
FAILED ← ─── ─── ─── ─── ─┘──────────────┘────────────────┘
  ↓
ROLLED_BACK → IDLE

PAUSED ↔ Any active state
```

### Phase States

```
PENDING → RUNNING → COMPLETED
           ↓
        FAILED → RETRYING → RUNNING
           ↓
        SKIPPED
```

### State Transitions

All state transitions are validated by the StateMachineService:

```typescript
// Valid pipeline transitions
IDLE → [INITIALIZING, FAILED]
INITIALIZING → [DECOMPOSING, FAILED, PAUSED]
DECOMPOSING → [ENRICHING, FAILED, PAUSED]
ENRICHING → [GENERATING_PROMPTS, FAILED, PAUSED]
GENERATING_PROMPTS → [COMPLETED, FAILED, PAUSED]
PAUSED → [DECOMPOSING, ENRICHING, GENERATING_PROMPTS, FAILED, ROLLED_BACK]
FAILED → [ROLLED_BACK, IDLE]
COMPLETED → [IDLE]
ROLLED_BACK → [IDLE]
```

## API Endpoints

### Start Pipeline

```http
POST /api/pipeline/start
Content-Type: application/json

{
  "taskId": "uuid",
  "projectRules": { ... },
  "codingStandards": ["Clean Code", "SOLID"],
  "techStack": ["NestJS", "TypeScript", "PostgreSQL"],
  "enableParallelPhases": false,
  "enableCheckpoints": true
}

Response:
{
  "pipelineId": "uuid",
  "message": "Pipeline started successfully"
}
```

### Get Pipeline State

```http
GET /api/pipeline/:pipelineId/state

Response:
{
  "pipelineId": "uuid",
  "state": "DECOMPOSING",
  "subscribersCount": 2
}
```

### Get Checkpoints

```http
GET /api/pipeline/:pipelineId/checkpoints

Response:
{
  "pipelineId": "uuid",
  "checkpoints": [
    {
      "id": "uuid",
      "state": "DECOMPOSING",
      "currentPhase": 1,
      "data": { ... },
      "createdAt": "2025-10-31T..."
    }
  ],
  "count": 3
}
```

### Pause Pipeline

```http
PATCH /api/pipeline/pause
Content-Type: application/json

{
  "pipelineId": "uuid",
  "reason": "Manual intervention required"
}
```

### Resume Pipeline

```http
PATCH /api/pipeline/resume
Content-Type: application/json

{
  "pipelineId": "uuid",
  "checkpointId": "uuid" // optional
}
```

### Rollback Pipeline

```http
POST /api/pipeline/rollback
Content-Type: application/json

{
  "pipelineId": "uuid",
  "checkpointId": "uuid",
  "reason": "Error in enrichment phase"
}
```

## WebSocket Events

### Connection

Connect to: `ws://localhost:3001/pipeline`

```javascript
const socket = io('http://localhost:3001/pipeline');

socket.on('connected', (data) => {
  console.log('Connected:', data.clientId);
});
```

### Subscribe to Pipeline

```javascript
socket.emit('subscribe', pipelineId);

socket.on('subscribed', ({ pipelineId }) => {
  console.log('Subscribed to:', pipelineId);
});
```

### Pipeline Events

```javascript
// All events
socket.on('pipeline-event', (event) => {
  console.log(event.type, event.data);
});

// Specific events
socket.on('pipeline-started', (data) => { ... });
socket.on('pipeline-completed', (data) => { ... });
socket.on('pipeline-failed', (data) => { ... });
socket.on('phase-started', (data) => { ... });
socket.on('phase-completed', (data) => { ... });
socket.on('phase-failed', (data) => { ... });
socket.on('subtask-generated', (data) => { ... });
socket.on('error-occurred', (data) => { ... });
socket.on('checkpoint-created', (data) => { ... });
```

### Event Structure

```typescript
{
  type: PipelineEventType,
  pipelineId: string,
  taskId: string,
  timestamp: string,
  data: {
    // Event-specific data
  }
}
```

## Queue Configuration

### Queues

1. **pipeline** - Main pipeline execution
2. **decomposition** - Task decomposition jobs
3. **enrichment** - Subtask enrichment jobs

### Queue Options

```typescript
{
  connection: {
    host: 'localhost',
    port: 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  }
}
```

### Job Processing

Each processor extends `WorkerHost` from `@nestjs/bullmq`:

```typescript
@Processor('queue-name')
export class MyProcessor extends WorkerHost {
  async process(job: Job): Promise<Result> {
    // Process job
    await job.updateProgress(50);
    return result;
  }
}
```

## Database Schema

### Pipeline Table

```sql
CREATE TABLE pipelines (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  state VARCHAR(50),
  config JSONB,
  context JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Pipeline Phase Execution Table

```sql
CREATE TABLE pipeline_phase_executions (
  id UUID PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id),
  phase_id UUID,
  phase_name VARCHAR(255),
  order INTEGER,
  state VARCHAR(50),
  config JSONB,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Pipeline Checkpoint Table

```sql
CREATE TABLE pipeline_checkpoints (
  id UUID PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id),
  state VARCHAR(50),
  current_phase INTEGER,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Pipeline Event Table

```sql
CREATE TABLE pipeline_events (
  id UUID PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id),
  event_type VARCHAR(100),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### Environment Variables

```env
# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager

# Pipeline Config
PIPELINE_ENABLE_CHECKPOINTS=true
PIPELINE_CHECKPOINT_INTERVAL=60
PIPELINE_MAX_RETRIES=3
PIPELINE_TIMEOUT_MS=600000

# WebSocket
FRONTEND_URL=http://localhost:3000
```

### Pipeline Configuration

```typescript
const config: PipelineConfig = {
  enableParallelPhases: false,      // Execute phases in parallel
  enableCheckpoints: true,          // Create checkpoints
  checkpointInterval: 60,           // Seconds between checkpoints
  retryStrategy: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
  },
  timeoutMs: 600000,                // 10 minutes
  enableAuditLog: true,
};
```

## Error Handling

### Retry Strategy

Automatic retries with exponential backoff:

```typescript
retry_delay = initialDelayMs * (backoffMultiplier ^ retry_count)
max_delay = min(retry_delay, maxDelayMs)
```

Example:
- Attempt 1: 1000ms
- Attempt 2: 2000ms
- Attempt 3: 4000ms

### Error Categories

1. **Validation Errors** - Invalid input or state
2. **Processing Errors** - Job execution failures
3. **State Errors** - Invalid state transitions
4. **Timeout Errors** - Job exceeded timeout
5. **System Errors** - Infrastructure failures

### Error Recovery

1. **Automatic Retry** - Up to maxRetries attempts
2. **Checkpoint Rollback** - Restore to last good state
3. **Manual Intervention** - Admin can pause/resume/rollback
4. **Dead Letter Queue** - Failed jobs for analysis

## Usage Example

### Starting a Pipeline

```typescript
import { PipelineService } from './services/pipeline.service';

// Create context
const context: PipelineContext = {
  taskId: 'task-uuid',
  userId: 'user-uuid',
  projectRules: {
    naming: 'camelCase',
    maxLineLength: 100,
  },
  codingStandards: ['Clean Code', 'SOLID', 'TDD'],
  techStack: ['NestJS', 'TypeScript', 'PostgreSQL', 'Prisma'],
};

// Start pipeline
const pipelineId = await pipelineService.startPipeline(context, {
  enableCheckpoints: true,
  enableParallelPhases: false,
});

console.log(`Pipeline started: ${pipelineId}`);
```

### Monitoring Progress (Frontend)

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3001/pipeline');

socket.on('connected', () => {
  socket.emit('subscribe', pipelineId);
});

socket.on('phase-completed', (event) => {
  console.log(`Phase ${event.data.phaseName} completed!`);
  updateUI(event);
});

socket.on('subtask-generated', (event) => {
  console.log('New subtask:', event.data.subtask);
  addSubtaskToList(event.data.subtask);
});

socket.on('pipeline-completed', (event) => {
  console.log('Pipeline completed!', event.data);
  showResults(event.data);
});
```

## Testing

### Unit Tests

```bash
npm run test -- pipeline.service.spec.ts
npm run test -- state-machine.service.spec.ts
```

### Integration Tests

```bash
npm run test:e2e -- pipeline.e2e-spec.ts
```

### Test Coverage

```bash
npm run test:cov
```

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing** - Enable `enableParallelPhases` for independent phases
2. **Checkpoint Interval** - Balance between recovery granularity and overhead
3. **Queue Concurrency** - Configure worker concurrency based on resources
4. **Database Indexing** - Indexes on pipeline_id, state, created_at
5. **Redis Optimization** - Use Redis cluster for high-throughput scenarios

### Scalability

- **Horizontal Scaling**: Multiple workers can process jobs from same queue
- **Queue Partitioning**: Separate queues for different priority levels
- **Database Sharding**: Partition pipeline data by creation date
- **Caching**: Cache checkpoint data in Redis for fast recovery

## Monitoring

### Metrics to Track

- Pipeline execution time per phase
- Queue depth and processing rate
- Error rates and retry counts
- WebSocket connection count
- Database query performance
- Redis memory usage

### Logging

All components use NestJS Logger:

```typescript
this.logger.log(`Pipeline ${pipelineId} started`);
this.logger.error(`Phase failed: ${error.message}`, error.stack);
this.logger.warn(`Retry attempt ${retryCount}/${maxRetries}`);
```

## Future Enhancements

- [ ] AI provider integration for actual decomposition
- [ ] Template system integration
- [ ] Advanced scheduling (cron jobs, dependencies)
- [ ] Pipeline visualization dashboard
- [ ] Metrics and analytics
- [ ] Pipeline templates and presets
- [ ] Multi-tenant isolation
- [ ] Export pipeline results (PDF, JSON, Markdown)

## Troubleshooting

### Pipeline Stuck in Running State

1. Check queue status: `GET /api/pipeline/:id/state`
2. View checkpoints: `GET /api/pipeline/:id/checkpoints`
3. Rollback if needed: `POST /api/pipeline/rollback`

### WebSocket Not Receiving Events

1. Verify connection: Check `connected` event
2. Check subscription: Emit `subscribe` with pipelineId
3. Verify CORS settings in gateway

### Queue Jobs Not Processing

1. Check Redis connection
2. Verify queue processor is running
3. Check job status in BullMQ dashboard
4. Review error logs

## Contributing

When adding new features:

1. Update state machine transitions if needed
2. Add new DTOs and interfaces
3. Implement validation
4. Add WebSocket events
5. Update documentation
6. Add tests

## License

MIT

---

**Status**: Production Ready ✅
**Last Updated**: October 31, 2025
**Version**: 1.0.0
