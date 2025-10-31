import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { PipelineService } from '../services/pipeline.service';
import { PipelineContext, PipelineConfig } from '../interfaces/pipeline.interface';

/**
 * Pipeline Queue Processor
 * Handles main pipeline execution jobs
 */
@Processor('pipeline')
export class PipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(PipelineProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineService: PipelineService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    const { pipelineId, context, config } = job.data as {
      pipelineId: string;
      context: PipelineContext;
      config: PipelineConfig;
    };

    this.logger.log(`Processing pipeline job ${job.id} (${pipelineId})`);

    try {
      // Update job progress
      await job.updateProgress(10);

      // Execute pipeline
      const result = await this.pipelineService.executePipeline(pipelineId, context, config);

      await job.updateProgress(100);

      this.logger.log(`Pipeline job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Pipeline job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
