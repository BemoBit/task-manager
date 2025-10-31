import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubtaskCategory } from '../interfaces/pipeline.interface';

export class StartPipelineDto {
  @ApiProperty({ description: 'Task ID to process' })
  @IsString()
  taskId: string;

  @ApiPropertyOptional({ description: 'Project-specific rules' })
  @IsOptional()
  @IsObject()
  projectRules?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Coding standards to apply', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codingStandards?: string[];

  @ApiPropertyOptional({ description: 'Technology stack details', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];

  @ApiPropertyOptional({ description: 'Enable parallel phase execution' })
  @IsOptional()
  @IsBoolean()
  enableParallelPhases?: boolean;

  @ApiPropertyOptional({ description: 'Enable checkpoint creation' })
  @IsOptional()
  @IsBoolean()
  enableCheckpoints?: boolean;
}

export class PausePipelineDto {
  @ApiProperty({ description: 'Pipeline ID to pause' })
  @IsString()
  pipelineId: string;

  @ApiPropertyOptional({ description: 'Reason for pausing' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResumePipelineDto {
  @ApiProperty({ description: 'Pipeline ID to resume' })
  @IsString()
  pipelineId: string;

  @ApiPropertyOptional({ description: 'Resume from checkpoint ID' })
  @IsOptional()
  @IsString()
  checkpointId?: string;
}

export class RollbackPipelineDto {
  @ApiProperty({ description: 'Pipeline ID to rollback' })
  @IsString()
  pipelineId: string;

  @ApiProperty({ description: 'Checkpoint ID to rollback to' })
  @IsString()
  checkpointId: string;

  @ApiPropertyOptional({ description: 'Reason for rollback' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RetryPhaseDto {
  @ApiProperty({ description: 'Pipeline ID' })
  @IsString()
  pipelineId: string;

  @ApiProperty({ description: 'Phase ID to retry' })
  @IsString()
  phaseId: string;

  @ApiPropertyOptional({ description: 'Override max retries' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRetries?: number;
}

export class SkipPhaseDto {
  @ApiProperty({ description: 'Pipeline ID' })
  @IsString()
  pipelineId: string;

  @ApiProperty({ description: 'Phase ID to skip' })
  @IsString()
  phaseId: string;

  @ApiProperty({ description: 'Reason for skipping' })
  @IsString()
  reason: string;
}

export class CreateSubtaskDto {
  @ApiProperty({ description: 'Subtask category', enum: SubtaskCategory })
  @IsEnum(SubtaskCategory)
  category: SubtaskCategory;

  @ApiProperty({ description: 'Subtask title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Subtask description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Requirements', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ description: 'Dependencies', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Estimated effort' })
  @IsOptional()
  @IsString()
  estimatedEffort?: string;

  @ApiPropertyOptional({ description: 'Priority (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number;
}

export class UpdatePipelineConfigDto {
  @ApiPropertyOptional({ description: 'Enable parallel phase execution' })
  @IsOptional()
  @IsBoolean()
  enableParallelPhases?: boolean;

  @ApiPropertyOptional({ description: 'Enable checkpoints' })
  @IsOptional()
  @IsBoolean()
  enableCheckpoints?: boolean;

  @ApiPropertyOptional({ description: 'Checkpoint interval in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  checkpointInterval?: number;

  @ApiPropertyOptional({ description: 'Maximum retries per phase' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRetries?: number;

  @ApiPropertyOptional({ description: 'Backoff multiplier for retries' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  backoffMultiplier?: number;

  @ApiPropertyOptional({ description: 'Pipeline timeout in milliseconds' })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  timeoutMs?: number;
}
