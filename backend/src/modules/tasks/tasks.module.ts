import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../database/database.module';
import { PipelineController } from './controllers/pipeline.controller';
import { SimpleTaskController } from './controllers/simple-task.controller';
import { PipelineService } from './services/pipeline.service';
import { StateMachineService } from './services/state-machine.service';
import { SimpleTaskService } from './services/simple-task.service';
import { PipelineProcessor } from './processors/pipeline.processor';
import { DecompositionProcessor } from './processors/decomposition.processor';
import { EnrichmentProcessor } from './processors/enrichment.processor';
import { PipelineGateway } from './gateways/pipeline.gateway';

/**
 * TasksModule - Task Management and Processing
 *
 * Features:
 * ✅ Task decomposition pipeline
 * ✅ Phase-based execution (Decomposition, Enrichment, Prompt Generation)
 * ✅ State machine implementation with validation
 * ✅ Queue management with BullMQ
 * ✅ Progress tracking and checkpoints
 * ✅ WebSocket events for real-time updates
 * ✅ Error handling and retry strategies
 * ✅ Rollback capabilities
 *
 * To be implemented:
 * - Task CRUD operations
 * - Task dependencies and scheduling
 * - AI provider integration
 * - Template system integration
 */
@Module({
  imports: [
    DatabaseModule,
    // Configure BullMQ queues
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue(
      { name: 'pipeline' },
      { name: 'decomposition' },
      { name: 'enrichment' },
    ),
  ],
  controllers: [PipelineController, SimpleTaskController],
  providers: [
    // Services
    PipelineService,
    StateMachineService,
    SimpleTaskService,
    // Processors
    PipelineProcessor,
    DecompositionProcessor,
    EnrichmentProcessor,
    // Gateway
    PipelineGateway,
  ],
  exports: [PipelineService, StateMachineService, SimpleTaskService, PipelineGateway],
})
export class TasksModule {}
