import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { StateMachineService } from './state-machine.service';
import {
  PipelineState,
  PipelineCheckpoint,
  PipelineContext,
  PipelineResult,
  PipelineConfig,
  SubtaskData,
  PhaseResult,
} from '../interfaces/pipeline.interface';
import { TaskStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Pipeline Service
 * Orchestrates the task processing pipeline with phase-based execution
 */
@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);
  private readonly activePipelines = new Map<string, PipelineState>();
  private readonly checkpoints = new Map<string, PipelineCheckpoint[]>();

  // Default configuration
  private readonly defaultConfig: PipelineConfig = {
    enableParallelPhases: false,
    enableCheckpoints: true,
    checkpointInterval: 60, // 60 seconds
    retryStrategy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
    },
    timeoutMs: 600000, // 10 minutes
    enableAuditLog: true,
  };

  private pipelineQueueEvents: QueueEvents;
  private decompositionQueueEvents: QueueEvents;
  private enrichmentQueueEvents: QueueEvents;

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: StateMachineService,
    @InjectQueue('pipeline') private readonly pipelineQueue: Queue,
    @InjectQueue('decomposition') private readonly decompositionQueue: Queue,
    @InjectQueue('enrichment') private readonly enrichmentQueue: Queue,
  ) {
    // Initialize QueueEvents for listening to job events
    this.pipelineQueueEvents = new QueueEvents('pipeline');
    this.decompositionQueueEvents = new QueueEvents('decomposition');
    this.enrichmentQueueEvents = new QueueEvents('enrichment');
  }

  /**
   * Start a new pipeline for a task
   */
  async startPipeline(context: PipelineContext, config?: Partial<PipelineConfig>): Promise<string> {
    const pipelineId = uuidv4();
    const mergedConfig = { ...this.defaultConfig, ...config };

    this.logger.log(`Starting pipeline ${pipelineId} for task ${context.taskId}`);

    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: context.taskId },
      include: { phase: true },
    });

    if (!task) {
      throw new NotFoundException(`Task ${context.taskId} not found`);
    }

    // Initialize pipeline state
    this.activePipelines.set(pipelineId, PipelineState.IDLE);
    this.checkpoints.set(pipelineId, []);

    // Transition to initializing
    await this.transitionPipeline(pipelineId, PipelineState.INITIALIZING, context);

    // Create checkpoint
    if (mergedConfig.enableCheckpoints) {
      await this.createCheckpoint(pipelineId, context);
    }

    // Queue pipeline execution
    await this.pipelineQueue.add(
      'execute',
      {
        pipelineId,
        context,
        config: mergedConfig,
      },
      {
        jobId: pipelineId,
        attempts: 1,
      },
    );

    return pipelineId;
  }

  /**
   * Execute pipeline phases
   */
  async executePipeline(
    pipelineId: string,
    context: PipelineContext,
    config: PipelineConfig,
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const phases: PhaseResult[] = [];
    const subtasks: SubtaskData[] = [];
    const prompts: string[] = [];

    try {
      this.logger.log(`Executing pipeline ${pipelineId}`);

      // Phase 1: Decomposition
      await this.transitionPipeline(pipelineId, PipelineState.DECOMPOSING, context);
      const decompositionResult = await this.executeDecompositionPhase(pipelineId, context, config);
      phases.push(decompositionResult);
      subtasks.push(...(decompositionResult.subtasksGenerated || []));

      // Create checkpoint after decomposition
      if (config.enableCheckpoints) {
        await this.createCheckpoint(pipelineId, context, { subtasks });
      }

      // Phase 2: Enrichment
      await this.transitionPipeline(pipelineId, PipelineState.ENRICHING, context);
      const enrichmentResult = await this.executeEnrichmentPhase(
        pipelineId,
        context,
        subtasks,
        config,
      );
      phases.push(enrichmentResult);

      // Create checkpoint after enrichment
      if (config.enableCheckpoints) {
        await this.createCheckpoint(pipelineId, context, {
          subtasks,
          enriched: true,
        });
      }

      // Phase 3: Prompt Generation
      await this.transitionPipeline(pipelineId, PipelineState.GENERATING_PROMPTS, context);
      const promptResult = await this.generatePrompts(pipelineId, context, subtasks);
      phases.push(promptResult);
      prompts.push(...(promptResult.output.prompts as string[]));

      // Transition to completed
      await this.transitionPipeline(pipelineId, PipelineState.COMPLETED, context);

      const duration = Date.now() - startTime;

      this.logger.log(
        `Pipeline ${pipelineId} completed in ${duration}ms with ${subtasks.length} subtasks`,
      );

      return {
        pipelineId,
        taskId: context.taskId,
        state: PipelineState.COMPLETED,
        phases,
        subtasks,
        prompts,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration,
      };
    } catch (error) {
      this.logger.error(`Pipeline ${pipelineId} failed: ${error.message}`, error.stack);

      await this.transitionPipeline(pipelineId, PipelineState.FAILED, context);

      const duration = Date.now() - startTime;

      return {
        pipelineId,
        taskId: context.taskId,
        state: PipelineState.FAILED,
        phases,
        subtasks,
        prompts,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration,
        error: error.message,
      };
    } finally {
      // Cleanup
      this.activePipelines.delete(pipelineId);
    }
  }

  /**
   * Execute decomposition phase
   */
  private async executeDecompositionPhase(
    pipelineId: string,
    context: PipelineContext,
    config: PipelineConfig,
  ): Promise<PhaseResult> {
    const phaseId = `${pipelineId}-decomposition`;
    const startTime = Date.now();

    try {
      this.logger.log(`Executing decomposition phase for ${pipelineId}`);

      // Get task details
      const task = await this.prisma.task.findUnique({
        where: { id: context.taskId },
      });

      if (!task) {
        throw new Error(`Task ${context.taskId} not found`);
      }

      // Queue decomposition job
      const job = await this.decompositionQueue.add(
        'decompose',
        {
          pipelineId,
          taskId: context.taskId,
          taskDescription: task.description,
          context,
        },
        {
          attempts: config.retryStrategy.maxRetries,
          backoff: {
            type: 'exponential',
            delay: config.retryStrategy.initialDelayMs,
          },
        },
      );

      // Wait for job completion
      const result = await job.waitUntilFinished(this.decompositionQueueEvents);

      const duration = Date.now() - startTime;

      return {
        phaseId,
        success: true,
        output: result,
        duration,
        subtasksGenerated: result.subtasks,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Decomposition phase failed: ${error.message}`, error.stack);

      return {
        phaseId,
        success: false,
        output: {},
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Execute enrichment phase
   */
  private async executeEnrichmentPhase(
    pipelineId: string,
    context: PipelineContext,
    subtasks: SubtaskData[],
    config: PipelineConfig,
  ): Promise<PhaseResult> {
    const phaseId = `${pipelineId}-enrichment`;
    const startTime = Date.now();

    try {
      this.logger.log(`Executing enrichment phase for ${pipelineId}`);

      // Queue enrichment job
      const job = await this.enrichmentQueue.add(
        'enrich',
        {
          pipelineId,
          taskId: context.taskId,
          subtasks,
          context,
        },
        {
          attempts: config.retryStrategy.maxRetries,
          backoff: {
            type: 'exponential',
            delay: config.retryStrategy.initialDelayMs,
          },
        },
      );

      // Wait for job completion
      const result = await job.waitUntilFinished(this.enrichmentQueueEvents);

      const duration = Date.now() - startTime;

      return {
        phaseId,
        success: true,
        output: result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Enrichment phase failed: ${error.message}`, error.stack);

      return {
        phaseId,
        success: false,
        output: {},
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Generate implementation prompts
   */
  private async generatePrompts(
    pipelineId: string,
    context: PipelineContext,
    subtasks: SubtaskData[],
  ): Promise<PhaseResult> {
    const phaseId = `${pipelineId}-prompts`;
    const startTime = Date.now();

    try {
      this.logger.log(`Generating prompts for ${pipelineId}`);

      const prompts: string[] = [];

      // Group subtasks by category
      const subtasksByCategory = subtasks.reduce(
        (acc, subtask) => {
          if (!acc[subtask.category]) {
            acc[subtask.category] = [];
          }
          acc[subtask.category].push(subtask);
          return acc;
        },
        {} as Record<string, SubtaskData[]>,
      );

      // Generate prompts for each category
      for (const [category, categorySubtasks] of Object.entries(subtasksByCategory)) {
        const prompt = this.buildPromptForCategory(category, categorySubtasks, context);
        prompts.push(prompt);
      }

      const duration = Date.now() - startTime;

      return {
        phaseId,
        success: true,
        output: { prompts },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Prompt generation failed: ${error.message}`);

      return {
        phaseId,
        success: false,
        output: {},
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Build prompt for a category
   */
  private buildPromptForCategory(
    category: string,
    subtasks: SubtaskData[],
    context: PipelineContext,
  ): string {
    let prompt = `# ${category} Implementation\n\n`;
    prompt += `## Context\n`;
    prompt += `Task ID: ${context.taskId}\n\n`;

    if (context.techStack && context.techStack.length > 0) {
      prompt += `### Technology Stack\n`;
      prompt += context.techStack.map((tech) => `- ${tech}`).join('\n');
      prompt += '\n\n';
    }

    if (context.codingStandards && context.codingStandards.length > 0) {
      prompt += `### Coding Standards\n`;
      prompt += context.codingStandards.map((std) => `- ${std}`).join('\n');
      prompt += '\n\n';
    }

    prompt += `## Subtasks\n\n`;

    subtasks.forEach((subtask, index) => {
      prompt += `### ${index + 1}. ${subtask.title}\n\n`;
      prompt += `${subtask.description}\n\n`;

      if (subtask.requirements && subtask.requirements.length > 0) {
        prompt += `**Requirements:**\n`;
        prompt += subtask.requirements.map((req) => `- ${req}`).join('\n');
        prompt += '\n\n';
      }

      if (subtask.dependencies && subtask.dependencies.length > 0) {
        prompt += `**Dependencies:**\n`;
        prompt += subtask.dependencies.map((dep) => `- ${dep}`).join('\n');
        prompt += '\n\n';
      }

      if (subtask.estimatedEffort) {
        prompt += `**Estimated Effort:** ${subtask.estimatedEffort}\n\n`;
      }
    });

    prompt += `\n## Implementation Guidelines\n`;
    prompt += `Please implement the above subtasks following the coding standards and using the specified technology stack.\n`;

    return prompt;
  }

  /**
   * Transition pipeline state
   */
  private async transitionPipeline(
    pipelineId: string,
    newState: PipelineState,
    context: PipelineContext,
  ): Promise<void> {
    const currentState = this.activePipelines.get(pipelineId) || PipelineState.IDLE;

    const transitionedState = this.stateMachine.transitionPipeline(
      currentState,
      newState,
      pipelineId,
    );

    this.activePipelines.set(pipelineId, transitionedState);

    // Update task status in database
    await this.updateTaskStatus(context.taskId, transitionedState);

    this.logger.log(`Pipeline ${pipelineId} transitioned to ${newState}`);
  }

  /**
   * Create checkpoint
   */
  private async createCheckpoint(
    pipelineId: string,
    context: PipelineContext,
    data?: Record<string, unknown>,
  ): Promise<PipelineCheckpoint> {
    const currentState = this.activePipelines.get(pipelineId) || PipelineState.IDLE;

    const checkpoint: PipelineCheckpoint = {
      id: uuidv4(),
      pipelineId,
      state: currentState,
      currentPhase: 0,
      data: data || {},
      createdAt: new Date(),
    };

    const checkpoints = this.checkpoints.get(pipelineId) || [];
    checkpoints.push(checkpoint);
    this.checkpoints.set(pipelineId, checkpoints);

    this.logger.log(`Checkpoint created for pipeline ${pipelineId} at state ${currentState}`);

    return checkpoint;
  }

  /**
   * Get pipeline state
   */
  getPipelineState(pipelineId: string): PipelineState | undefined {
    return this.activePipelines.get(pipelineId);
  }

  /**
   * Get checkpoints for pipeline
   */
  getCheckpoints(pipelineId: string): PipelineCheckpoint[] {
    return this.checkpoints.get(pipelineId) || [];
  }

  /**
   * Pause pipeline
   */
  async pausePipeline(pipelineId: string): Promise<void> {
    const currentState = this.activePipelines.get(pipelineId);
    if (!currentState) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    const job = await this.pipelineQueue.getJob(pipelineId);
    if (job) {
      await job.updateProgress({ paused: true });
    }

    this.logger.log(`Pipeline ${pipelineId} paused`);
  }

  /**
   * Resume pipeline
   */
  async resumePipeline(pipelineId: string, checkpointId?: string): Promise<void> {
    const currentState = this.activePipelines.get(pipelineId);
    if (!currentState) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    const job = await this.pipelineQueue.getJob(pipelineId);
    if (job) {
      await job.updateProgress({ paused: false, checkpointId });
    }

    this.logger.log(`Pipeline ${pipelineId} resumed`);
  }

  /**
   * Rollback to checkpoint
   */
  async rollbackToCheckpoint(pipelineId: string, checkpointId: string): Promise<void> {
    const checkpoints = this.checkpoints.get(pipelineId);
    if (!checkpoints) {
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);
    }

    const checkpoint = checkpoints.find((cp) => cp.id === checkpointId);
    if (!checkpoint) {
      throw new NotFoundException(`Checkpoint ${checkpointId} not found`);
    }

    this.activePipelines.set(pipelineId, checkpoint.state);
    this.logger.log(`Pipeline ${pipelineId} rolled back to checkpoint ${checkpointId}`);
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(taskId: string, pipelineState: PipelineState): Promise<void> {
    let taskStatus: TaskStatus;

    switch (pipelineState) {
      case PipelineState.IDLE:
      case PipelineState.INITIALIZING:
        taskStatus = TaskStatus.PENDING;
        break;
      case PipelineState.DECOMPOSING:
      case PipelineState.ENRICHING:
      case PipelineState.GENERATING_PROMPTS:
        taskStatus = TaskStatus.IN_PROGRESS;
        break;
      case PipelineState.COMPLETED:
        taskStatus = TaskStatus.COMPLETED;
        break;
      case PipelineState.FAILED:
        taskStatus = TaskStatus.FAILED;
        break;
      case PipelineState.PAUSED:
        taskStatus = TaskStatus.IN_PROGRESS;
        break;
      default:
        taskStatus = TaskStatus.PENDING;
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: { status: taskStatus },
    });
  }
}
