import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { SubtaskData, SubtaskCategory, PipelineContext } from '../interfaces/pipeline.interface';

/**
 * Decomposition Queue Processor
 * Breaks down tasks into structured subtasks
 */
@Processor('decomposition')
export class DecompositionProcessor extends WorkerHost {
  private readonly logger = new Logger(DecompositionProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<{ subtasks: SubtaskData[]; metadata: Record<string, unknown> }> {
    const { pipelineId, taskId, taskDescription, context } = job.data as {
      pipelineId: string;
      taskId: string;
      taskDescription: string;
      context: PipelineContext;
    };

    this.logger.log(`Processing decomposition job ${job.id} for task ${taskId}`);

    try {
      await job.updateProgress(10);

      // Get task details
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { phase: { include: { template: true } } },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      await job.updateProgress(30);

      // Parse and decompose task
      const subtasks = await this.decomposeTask(taskDescription, context);

      await job.updateProgress(80);

      // Store subtasks in database
      await this.storeSubtasks(taskId, subtasks);

      await job.updateProgress(100);

      this.logger.log(`Decomposition job ${job.id} completed with ${subtasks.length} subtasks`);

      return {
        subtasks,
        metadata: {
          taskId,
          pipelineId,
          subtaskCount: subtasks.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Decomposition job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Decompose task into structured subtasks
   * This is a simplified implementation - in production, this would call AI service
   */
  private async decomposeTask(
    taskDescription: string,
    context: PipelineContext,
  ): Promise<SubtaskData[]> {
    const subtasks: SubtaskData[] = [];

    // Data Model Subtasks
    subtasks.push({
      category: SubtaskCategory.DATA_MODEL,
      title: 'Define Database Schema',
      description: `Create database schema for ${taskDescription}`,
      requirements: [
        'Identify all entities and relationships',
        'Define primary and foreign keys',
        'Add appropriate indexes',
        'Consider data validation rules',
      ],
      dependencies: [],
      estimatedEffort: '2-3 hours',
      priority: 1,
    });

    subtasks.push({
      category: SubtaskCategory.DATA_MODEL,
      title: 'Create TypeScript Interfaces',
      description: 'Define TypeScript interfaces for type safety',
      requirements: [
        'Match database schema structure',
        'Include validation decorators',
        'Document all properties',
      ],
      dependencies: ['Define Database Schema'],
      estimatedEffort: '1-2 hours',
      priority: 2,
    });

    // Service Subtasks
    subtasks.push({
      category: SubtaskCategory.SERVICE,
      title: 'Implement Service Layer',
      description: 'Create service class with business logic',
      requirements: [
        'Implement CRUD operations',
        'Add validation logic',
        'Include error handling',
        'Add logging',
      ],
      dependencies: ['Create TypeScript Interfaces'],
      estimatedEffort: '4-6 hours',
      priority: 3,
    });

    subtasks.push({
      category: SubtaskCategory.SERVICE,
      title: 'Add Business Rules',
      description: 'Implement domain-specific business logic',
      requirements: ['Validate business constraints', 'Handle edge cases', 'Optimize performance'],
      dependencies: ['Implement Service Layer'],
      estimatedEffort: '3-4 hours',
      priority: 4,
    });

    // HTTP/API Subtasks
    subtasks.push({
      category: SubtaskCategory.HTTP_API,
      title: 'Create REST Endpoints',
      description: 'Implement RESTful API endpoints',
      requirements: [
        'Define routes and HTTP methods',
        'Add request/response DTOs',
        'Implement authentication/authorization',
        'Add API documentation (Swagger)',
      ],
      dependencies: ['Implement Service Layer'],
      estimatedEffort: '3-4 hours',
      priority: 5,
    });

    subtasks.push({
      category: SubtaskCategory.HTTP_API,
      title: 'Add Input Validation',
      description: 'Validate all API inputs',
      requirements: [
        'Use class-validator decorators',
        'Add custom validators',
        'Provide clear error messages',
      ],
      dependencies: ['Create REST Endpoints'],
      estimatedEffort: '1-2 hours',
      priority: 6,
    });

    // Testing Subtasks
    subtasks.push({
      category: SubtaskCategory.TESTING,
      title: 'Write Unit Tests',
      description: 'Create comprehensive unit tests',
      requirements: [
        'Test all service methods',
        'Mock dependencies',
        'Achieve >80% code coverage',
        'Test edge cases',
      ],
      dependencies: ['Implement Service Layer'],
      estimatedEffort: '4-5 hours',
      priority: 7,
    });

    subtasks.push({
      category: SubtaskCategory.TESTING,
      title: 'Write Integration Tests',
      description: 'Create end-to-end integration tests',
      requirements: [
        'Test API endpoints',
        'Verify database operations',
        'Test authentication flow',
        'Use test database',
      ],
      dependencies: ['Create REST Endpoints', 'Write Unit Tests'],
      estimatedEffort: '3-4 hours',
      priority: 8,
    });

    // Apply project-specific customizations
    if (context.techStack) {
      this.logger.log(`Applying tech stack: ${context.techStack.join(', ')}`);
    }

    if (context.codingStandards) {
      this.logger.log(`Applying coding standards: ${context.codingStandards.join(', ')}`);
    }

    return subtasks;
  }

  /**
   * Store subtasks in database
   */
  private async storeSubtasks(taskId: string, subtasks: SubtaskData[]): Promise<void> {
    let order = 1;
    for (const subtask of subtasks) {
      await this.prisma.subtask.create({
        data: {
          taskId,
          title: subtask.title,
          order,
          type: subtask.category,
          content: {
            description: subtask.description,
            requirements: subtask.requirements,
            dependencies: subtask.dependencies,
            estimatedEffort: subtask.estimatedEffort,
            priority: subtask.priority,
          } as never,
          status: 'PENDING',
        },
      });
      order++;
    }

    this.logger.log(`Stored ${subtasks.length} subtasks for task ${taskId}`);
  }
}
