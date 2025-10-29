import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTemplatesDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'web-development' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'nodejs,react' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ example: 'template name search' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['DECOMPOSITION', 'ENRICHMENT', 'CUSTOM'] })
  @IsOptional()
  @IsEnum(['DECOMPOSITION', 'ENRICHMENT', 'CUSTOM'])
  type?: string;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'SHARED', 'PUBLIC'] })
  @IsOptional()
  @IsEnum(['PRIVATE', 'SHARED', 'PUBLIC'])
  accessLevel?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'name', 'usageCount', 'rating'],
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name', 'usageCount', 'rating'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: 'false', description: 'Include deleted templates' })
  @IsOptional()
  @IsIn(['true', 'false'])
  includeDeleted?: string = 'false';
}
