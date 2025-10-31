# Quick Start Guide - Advanced Features

This guide will help you get started with the newly implemented advanced features.

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
cd backend
npm install ioredis compression @nestjs/throttler axios
```

### Step 2: Update Environment Variables

Add these to your `backend/.env` file:

```env
# Database Optimization
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_SLOW_QUERY_THRESHOLD=1000
DB_MONITORING_ENABLED=true

# Caching
CACHE_TTL=3600
CACHE_MAX_ITEMS=1000
CACHE_COMPRESSION_ENABLED=true
QUERY_CACHE_ENABLED=true

# Backup
BACKUP_DIR=./backups
MAX_BACKUPS=10
BACKUP_INTERVAL_HOURS=24
```

### Step 3: Register New Services

Update `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Import new configurations
import databaseOptimizationConfig from './config/database-optimization.config';
import cacheConfig from './config/cache.config';

// Import new modules
import { PluginModule } from './common/plugins/plugin.module';

// Import new interceptors
import { CompressionInterceptor } from './common/interceptors/compression.interceptor';
import { PaginationInterceptor } from './common/interceptors/pagination.interceptor';
import { FieldSelectionInterceptor } from './common/interceptors/field-selection.interceptor';

// Import new services
import { DatabaseMonitoringService } from './common/database/database-monitoring.service';
import { MultiLevelCacheService } from './common/cache/cache.service';
import { WebhookService } from './common/integrations/webhook.service';
import { EventBusService } from './common/integrations/event-bus.service';
import { HealthMonitoringService } from './common/monitoring/health-monitoring.service';
import { BackupService } from './common/backup/backup.service';

// Import new controllers
import { BatchController } from './common/controllers/batch.controller';
import { StreamController } from './common/controllers/stream.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseOptimizationConfig,
        cacheConfig,
        // ... your existing configs
      ],
    }),
    PluginModule,
    // ... your existing modules
  ],
  controllers: [
    BatchController,
    StreamController,
    // ... your existing controllers
  ],
  providers: [
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: CompressionInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PaginationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: FieldSelectionInterceptor,
    },
    
    // New Services
    DatabaseMonitoringService,
    MultiLevelCacheService,
    WebhookService,
    EventBusService,
    HealthMonitoringService,
    BackupService,
    // ... your existing providers
  ],
})
export class AppModule {}
```

### Step 4: Start the Server

```bash
npm run start:dev
```

## 🧪 Test the Features

### 1. Test Health Monitoring

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-31T...",
  "uptime": 3600000,
  "indicators": {
    "database": { "status": "up", "responseTime": 45 },
    "memory": { "status": "up", "message": "Memory usage: 65.32%" }
  }
}
```

### 2. Test Pagination

```bash
curl "http://localhost:3001/api/tasks?page=1&limit=5&sortBy=createdAt&sortOrder=desc"
```

You'll get:
- Paginated data
- Total count
- Navigation links (first, prev, next, last)

### 3. Test Field Selection

```bash
# Get only specific fields
curl "http://localhost:3001/api/tasks?fields=id,title,status"

# Get nested fields
curl "http://localhost:3001/api/tasks?fields=id,title,assignee.name,assignee.email"
```

### 4. Test Plugin System

```bash
# List all plugins
curl http://localhost:3001/api/plugins

# Get plugin stats
curl http://localhost:3001/api/plugins/stats
```

### 5. Test Batch Requests

```bash
curl -X POST http://localhost:3001/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      { "method": "GET", "url": "/api/tasks/1" },
      { "method": "GET", "url": "/api/templates/1" }
    ]
  }'
```

### 6. Test Server-Sent Events

```bash
# Subscribe to real-time updates
curl -N http://localhost:3001/api/stream/events
```

## 🔌 Create Your First Plugin

### Step 1: Create Plugin Directory

```bash
mkdir -p backend/plugins/my-first-plugin
cd backend/plugins/my-first-plugin
```

### Step 2: Create Plugin File

Create `index.js`:

```javascript
module.exports = {
  metadata: {
    name: 'my-first-plugin',
    version: '1.0.0',
    description: 'My first task manager plugin',
    author: 'Your Name',
    hooks: ['task.before.create', 'task.after.create']
  },

  async initialize(context) {
    context.logger.log('My plugin is initializing!');
  },

  hooks: {
    'task.before.create': async (taskData, context) => {
      context.logger.log(`New task being created: ${taskData.title}`);
      
      // Add custom field
      return {
        ...taskData,
        customField: 'Added by my plugin'
      };
    },

    'task.after.create': async (task, context) => {
      context.logger.log(`Task created successfully: ${task.id}`);
      
      // Could send notification, update external system, etc.
      return task;
    }
  },

  async destroy() {
    console.log('Plugin is being destroyed');
  }
};
```

### Step 3: Restart Server

The plugin will be automatically loaded!

```bash
npm run start:dev
```

### Step 4: Verify Plugin Loaded

```bash
curl http://localhost:3001/api/plugins
```

## 💾 Use Caching in Your Services

### Example: Cache Template Data

```typescript
import { Injectable } from '@nestjs/common';
import { MultiLevelCacheService } from '../common/cache/cache.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class TemplateService {
  constructor(
    private readonly cache: MultiLevelCacheService,
    private readonly prisma: PrismaService,
  ) {}

  async getTemplate(id: string) {
    // Try cache first
    return this.cache.wrap(
      `template:${id}`,
      async () => {
        // If not in cache, fetch from database
        return await this.prisma.template.findUnique({
          where: { id },
          include: { phases: true },
        });
      },
      {
        ttl: 3600, // Cache for 1 hour
        tags: ['templates'], // For bulk invalidation
      }
    );
  }

  async updateTemplate(id: string, data: any) {
    const updated = await this.prisma.template.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await this.cache.del(`template:${id}`);
    await this.cache.invalidateByTag('templates');

    return updated;
  }
}
```

## 🔔 Use Webhooks and Event Bus

### Register a Webhook

```typescript
import { Injectable } from '@nestjs/common';
import { WebhookService } from '../common/integrations/webhook.service';

@Injectable()
export class TaskService {
  constructor(private readonly webhookService: WebhookService) {}

  async initialize() {
    // Register webhook for task events
    await this.webhookService.registerWebhook({
      url: 'https://your-app.com/webhook',
      events: ['task.created', 'task.completed'],
      secret: 'your-webhook-secret',
      active: true,
      retryConfig: {
        maxRetries: 3,
        backoff: 'exponential',
      },
    });
  }

  async createTask(data: any) {
    const task = await this.prisma.task.create({ data });
    
    // Trigger webhook
    await this.webhookService.triggerEvent('task.created', task);
    
    return task;
  }
}
```

### Use Event Bus

```typescript
import { Injectable } from '@nestjs/common';
import { EventBusService } from '../common/integrations/event-bus.service';

@Injectable()
export class NotificationService {
  constructor(private readonly eventBus: EventBusService) {}

  async initialize() {
    // Subscribe to task completion events
    this.eventBus.subscribe('task.completed', async (task) => {
      await this.sendCompletionEmail(task);
    });
  }

  private async sendCompletionEmail(task: any) {
    console.log(`Sending email for completed task: ${task.id}`);
    // Email sending logic
  }
}

// In TaskService
async completeTask(id: string) {
  const task = await this.prisma.task.update({
    where: { id },
    data: { status: 'COMPLETED' },
  });

  // Publish event
  await this.eventBus.publish('task.completed', task);

  return task;
}
```

## 🖥️ Setup CLI Tool

### Step 1: Install CLI

```bash
cd cli
npm install
npm link
```

### Step 2: Configure

```bash
export API_URL=http://localhost:3001/api
export API_TOKEN=your-auth-token-here
```

### Step 3: Use CLI

```bash
# Check health
task-cli system health

# List tasks
task-cli task list

# Create task
task-cli task create "New task from CLI" --priority 5

# Get task details
task-cli task get <task-id>
```

## 💾 Setup Automated Backups

### In Your Bootstrap File

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BackupService } from './common/backup/backup.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Start automated backups
  const backupService = app.get(BackupService);
  backupService.scheduleAutomatedBackups();

  // Create initial backup
  await backupService.createBackup('full');

  await app.listen(3001);
}
bootstrap();
```

### Manual Backup Commands

```typescript
// In a controller or service
const backup = await backupService.createBackup('full');
console.log(`Backup created: ${backup.id}`);

// List backups
const backups = backupService.listBackups();

// Restore backup
await backupService.restoreBackup(backup.id);
```

## 📊 Monitor Database Performance

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseMonitoringService } from '../common/database/database-monitoring.service';

@Injectable()
export class AdminController {
  constructor(
    private readonly dbMonitoring: DatabaseMonitoringService,
  ) {}

  @Get('metrics')
  getMetrics() {
    return this.dbMonitoring.getMetrics();
  }

  @Get('slow-queries')
  getSlowQueries() {
    return this.dbMonitoring.getSlowQueries(10);
  }
}
```

## 🎯 Next Steps

1. **Explore the API**: Visit http://localhost:3001/api/docs for Swagger documentation
2. **Create Plugins**: Build custom plugins for your specific needs
3. **Monitor Performance**: Check database metrics and cache statistics
4. **Setup Webhooks**: Integrate with external services
5. **Use CLI**: Automate tasks with the command-line tool

## 📚 Additional Resources

- [Full Implementation Guide](./SYSTEM_OPTIMIZATIONS.md)
- [Implementation Complete Report](./IMPLEMENTATION_COMPLETE.md)
- [Original Architecture](./Task%20Manager%20System%20Architecture%20-%20AI%20Design.md)

## 🆘 Troubleshooting

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Start Redis
redis-server
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL
```

### Plugin Not Loading
```bash
# Check plugin directory
ls -la backend/plugins/

# Check logs
npm run start:dev
```

---

**Happy coding!** 🚀 Your Task Manager now has enterprise-grade features!
