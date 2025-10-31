import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PipelineService } from '../services/pipeline.service';
import { PipelineGateway } from '../gateways/pipeline.gateway';
import {
  StartPipelineDto,
  PausePipelineDto,
  ResumePipelineDto,
  RollbackPipelineDto,
} from '../dto/pipeline.dto';
import { PipelineContext } from '../interfaces/pipeline.interface';

/**
 * Pipeline Controller
 * REST API endpoints for pipeline management
 */
@ApiTags('Pipeline')
@Controller('pipeline')
// Uncomment when auth is ready: @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class PipelineController {
  private readonly logger = new Logger(PipelineController.name);

  constructor(
    private readonly pipelineService: PipelineService,
    private readonly pipelineGateway: PipelineGateway,
  ) {}

  /**
   * Start a new pipeline
   */
  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new task processing pipeline' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pipeline started successfully',
    schema: {
      type: 'object',
      properties: {
        pipelineId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
  })
  async startPipeline(@Body() dto: StartPipelineDto) {
    this.logger.log(`Starting pipeline for task ${dto.taskId}`);

    const context: PipelineContext = {
      taskId: dto.taskId,
      userId: 'system', // TODO: Get from auth context
      projectRules: dto.projectRules,
      codingStandards: dto.codingStandards,
      techStack: dto.techStack,
    };

    const config = {
      enableParallelPhases: dto.enableParallelPhases,
      enableCheckpoints: dto.enableCheckpoints,
    };

    const pipelineId = await this.pipelineService.startPipeline(context, config);

    // Emit WebSocket event
    this.pipelineGateway.emitPipelineStarted(pipelineId, dto.taskId, {
      config,
      context,
    });

    return {
      pipelineId,
      message: 'Pipeline started successfully',
    };
  }

  /**
   * Get pipeline state
   */
  @Get(':pipelineId/state')
  @ApiOperation({ summary: 'Get current pipeline state' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pipeline state retrieved',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pipeline not found',
  })
  async getPipelineState(@Param('pipelineId') pipelineId: string) {
    const state = this.pipelineService.getPipelineState(pipelineId);

    if (!state) {
      return {
        message: 'Pipeline not found or completed',
        pipelineId,
      };
    }

    return {
      pipelineId,
      state,
      subscribersCount: this.pipelineGateway.getPipelineSubscribersCount(pipelineId),
    };
  }

  /**
   * Get pipeline checkpoints
   */
  @Get(':pipelineId/checkpoints')
  @ApiOperation({ summary: 'Get pipeline checkpoints' })
  @ApiParam({ name: 'pipelineId', description: 'Pipeline ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checkpoints retrieved',
  })
  async getCheckpoints(@Param('pipelineId') pipelineId: string) {
    const checkpoints = this.pipelineService.getCheckpoints(pipelineId);

    return {
      pipelineId,
      checkpoints,
      count: checkpoints.length,
    };
  }

  /**
   * Pause pipeline
   */
  @Patch('pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause a running pipeline' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pipeline paused successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pipeline not found',
  })
  async pausePipeline(@Body() dto: PausePipelineDto) {
    this.logger.log(`Pausing pipeline ${dto.pipelineId}`);

    await this.pipelineService.pausePipeline(dto.pipelineId);

    // Emit WebSocket event
    this.pipelineGateway.emitPipelineEvent({
      type: 'PIPELINE_PAUSED' as never,
      pipelineId: dto.pipelineId,
      taskId: '', // TODO: Get from pipeline context
      timestamp: new Date(),
      data: { reason: dto.reason },
    });

    return {
      pipelineId: dto.pipelineId,
      message: 'Pipeline paused successfully',
    };
  }

  /**
   * Resume pipeline
   */
  @Patch('resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused pipeline' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pipeline resumed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pipeline not found',
  })
  async resumePipeline(@Body() dto: ResumePipelineDto) {
    this.logger.log(`Resuming pipeline ${dto.pipelineId}`);

    await this.pipelineService.resumePipeline(dto.pipelineId, dto.checkpointId);

    // Emit WebSocket event
    this.pipelineGateway.emitPipelineEvent({
      type: 'PIPELINE_RESUMED' as never,
      pipelineId: dto.pipelineId,
      taskId: '', // TODO: Get from pipeline context
      timestamp: new Date(),
      data: { checkpointId: dto.checkpointId },
    });

    return {
      pipelineId: dto.pipelineId,
      message: 'Pipeline resumed successfully',
    };
  }

  /**
   * Rollback pipeline
   */
  @Post('rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rollback pipeline to a checkpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pipeline rolled back successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pipeline or checkpoint not found',
  })
  async rollbackPipeline(@Body() dto: RollbackPipelineDto) {
    this.logger.log(`Rolling back pipeline ${dto.pipelineId} to checkpoint ${dto.checkpointId}`);

    await this.pipelineService.rollbackToCheckpoint(dto.pipelineId, dto.checkpointId);

    return {
      pipelineId: dto.pipelineId,
      checkpointId: dto.checkpointId,
      message: 'Pipeline rolled back successfully',
    };
  }

  /**
   * Get gateway statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get pipeline gateway statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved',
  })
  getStats() {
    return {
      connectedClients: this.pipelineGateway.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
