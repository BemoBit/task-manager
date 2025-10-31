import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { AIProviderType } from '../interfaces/ai-provider.interface';

export class CreateProviderDto {
  @IsString()
  name: string;

  @IsEnum(AIProviderType)
  type: AIProviderType;

  @IsString()
  apiKey: string;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(1)
  maxTokens: number;

  @IsNumber()
  @Min(0)
  @Max(2)
  temperature: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  topP?: number;

  @IsNumber()
  @IsOptional()
  topK?: number;

  @IsNumber()
  @IsOptional()
  @Min(-2)
  @Max(2)
  frequencyPenalty?: number;

  @IsNumber()
  @IsOptional()
  @Min(-2)
  @Max(2)
  presencePenalty?: number;

  @IsObject()
  @IsOptional()
  pricing?: {
    inputTokenCost: number;
    outputTokenCost: number;
    currency: string;
  };

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProviderDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  topP?: number;

  @IsNumber()
  @IsOptional()
  topK?: number;

  @IsNumber()
  @IsOptional()
  @Min(-2)
  @Max(2)
  frequencyPenalty?: number;

  @IsNumber()
  @IsOptional()
  @Min(-2)
  @Max(2)
  presencePenalty?: number;

  @IsObject()
  @IsOptional()
  pricing?: {
    inputTokenCost: number;
    outputTokenCost: number;
    currency: string;
  };

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CompletionRequestDto {
  @IsString()
  prompt: string;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxTokens?: number;

  @IsBoolean()
  @IsOptional()
  stream?: boolean;

  @IsString()
  @IsOptional()
  providerId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
