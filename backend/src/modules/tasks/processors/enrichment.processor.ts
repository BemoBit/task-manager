import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { SubtaskData, PipelineContext } from '../interfaces/pipeline.interface';

/**
 * Enrichment Queue Processor
 * Enriches subtasks with project-specific rules and best practices
 */
@Processor('enrichment')
export class EnrichmentProcessor extends WorkerHost {
  private readonly logger = new Logger(EnrichmentProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<{
    enrichedSubtasks: SubtaskData[];
    metadata: Record<string, unknown>;
  }> {
    const { pipelineId, taskId, subtasks, context } = job.data as {
      pipelineId: string;
      taskId: string;
      subtasks: SubtaskData[];
      context: PipelineContext;
    };

    this.logger.log(`Processing enrichment job ${job.id} for ${subtasks.length} subtasks`);

    try {
      await job.updateProgress(10);

      // Enrich each subtask with context
      const enrichedSubtasks = await this.enrichSubtasks(subtasks, context);

      await job.updateProgress(80);

      // Update subtasks in database
      await this.updateSubtasks(taskId, enrichedSubtasks);

      await job.updateProgress(100);

      this.logger.log(`Enrichment job ${job.id} completed for ${enrichedSubtasks.length} subtasks`);

      return {
        enrichedSubtasks,
        metadata: {
          taskId,
          pipelineId,
          enrichedCount: enrichedSubtasks.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Enrichment job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Enrich subtasks with project-specific context
   */
  private async enrichSubtasks(
    subtasks: SubtaskData[],
    context: PipelineContext,
  ): Promise<SubtaskData[]> {
    return subtasks.map((subtask) => {
      const enriched = { ...subtask };

      // Add tech stack specific requirements
      if (context.techStack && context.techStack.length > 0) {
        const techRequirements = this.generateTechStackRequirements(
          subtask.category,
          context.techStack,
        );
        enriched.requirements = [...(enriched.requirements || []), ...techRequirements];
      }

      // Add coding standards
      if (context.codingStandards && context.codingStandards.length > 0) {
        const standardRequirements = this.generateCodingStandardRequirements(
          context.codingStandards,
        );
        enriched.requirements = [...(enriched.requirements || []), ...standardRequirements];
      }

      // Add project rules
      if (context.projectRules) {
        enriched.description += `\n\nProject Context:\n${this.formatProjectRules(context.projectRules)}`;
      }

      // Enhance description with best practices
      enriched.description += `\n\n${this.getBestPractices(subtask.category)}`;

      return enriched;
    });
  }

  /**
   * Generate tech stack specific requirements
   */
  private generateTechStackRequirements(category: string, techStack: string[]): string[] {
    const requirements: string[] = [];
    const stackLower = techStack.map((t) => t.toLowerCase());

    // NestJS specific
    if (stackLower.includes('nestjs')) {
      requirements.push('Use NestJS decorators and dependency injection');
      requirements.push('Follow NestJS module structure');
    }

    // TypeScript specific
    if (stackLower.includes('typescript')) {
      requirements.push('Use strict TypeScript typing');
      requirements.push('Avoid using any type');
      requirements.push('Define proper interfaces and types');
    }

    // PostgreSQL specific
    if (stackLower.includes('postgresql') || stackLower.includes('postgres')) {
      requirements.push('Use appropriate PostgreSQL data types');
      requirements.push('Add proper indexes for query optimization');
    }

    // Prisma specific
    if (stackLower.includes('prisma')) {
      requirements.push('Define Prisma schema with proper relations');
      requirements.push('Use Prisma type-safe queries');
    }

    // React/Next.js specific
    if (stackLower.includes('react') || stackLower.includes('nextjs')) {
      requirements.push('Follow React hooks best practices');
      requirements.push('Implement proper error boundaries');
    }

    return requirements;
  }

  /**
   * Generate coding standard requirements
   */
  private generateCodingStandardRequirements(standards: string[]): string[] {
    const requirements: string[] = [];

    standards.forEach((standard) => {
      const standardLower = standard.toLowerCase();

      if (standardLower.includes('clean code')) {
        requirements.push('Use meaningful variable and function names');
        requirements.push('Keep functions small and focused');
        requirements.push('Avoid code duplication');
      }

      if (standardLower.includes('solid')) {
        requirements.push('Apply SOLID principles');
        requirements.push('Single responsibility per class/module');
      }

      if (standardLower.includes('test')) {
        requirements.push('Write tests alongside implementation');
        requirements.push('Aim for high test coverage');
      }

      if (standardLower.includes('documentation')) {
        requirements.push('Add JSDoc comments for public APIs');
        requirements.push('Document complex logic and algorithms');
      }
    });

    return requirements;
  }

  /**
   * Format project rules for display
   */
  private formatProjectRules(rules: Record<string, unknown>): string {
    return Object.entries(rules)
      .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
      .join('\n');
  }

  /**
   * Get best practices for category
   */
  private getBestPractices(category: string): string {
    const practices: Record<string, string> = {
      DATA_MODEL: `Best Practices:
- Use appropriate data types for each field
- Add validation constraints at database level
- Include created_at and updated_at timestamps
- Use UUID for primary keys for distributed systems
- Add indexes for frequently queried fields
- Consider soft deletes instead of hard deletes`,

      SERVICE: `Best Practices:
- Implement proper error handling and logging
- Use dependency injection for testability
- Keep business logic separate from infrastructure
- Validate inputs at service boundary
- Use transactions for data consistency
- Implement caching where appropriate
- Follow single responsibility principle`,

      HTTP_API: `Best Practices:
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Implement proper status codes (200, 201, 400, 404, 500)
- Add request validation and sanitization
- Implement rate limiting and throttling
- Use DTOs for request/response typing
- Add comprehensive API documentation
- Implement authentication and authorization
- Use versioning for API endpoints`,

      TESTING: `Best Practices:
- Follow AAA pattern (Arrange, Act, Assert)
- Test both happy paths and error cases
- Mock external dependencies
- Use test fixtures and factories
- Aim for high code coverage (>80%)
- Keep tests isolated and independent
- Use descriptive test names
- Run tests in CI/CD pipeline`,
    };

    return practices[category] || 'Follow general best practices';
  }

  /**
   * Update subtasks in database
   */
  private async updateSubtasks(taskId: string, enrichedSubtasks: SubtaskData[]): Promise<void> {
    const existingSubtasks = await this.prisma.subtask.findMany({
      where: { taskId },
      orderBy: { order: 'asc' },
    });

    for (let i = 0; i < enrichedSubtasks.length; i++) {
      const enriched = enrichedSubtasks[i];
      const existing = existingSubtasks[i];

      if (existing) {
        await this.prisma.subtask.update({
          where: { id: existing.id },
          data: {
            content: {
              description: enriched.description,
              requirements: enriched.requirements,
              dependencies: enriched.dependencies,
              estimatedEffort: enriched.estimatedEffort,
              priority: enriched.priority,
            } as never,
          },
        });
      }
    }

    this.logger.log(`Updated ${enrichedSubtasks.length} subtasks for task ${taskId}`);
  }
}
