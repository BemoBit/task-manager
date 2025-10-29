import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ITemplateContent } from '../interfaces/template.interface';

export enum TemplateType {
  DECOMPOSITION = 'DECOMPOSITION',
  ENRICHMENT = 'ENRICHMENT',
  CUSTOM = 'CUSTOM',
}

export enum TemplateAccessLevel {
  PRIVATE = 'PRIVATE',
  SHARED = 'SHARED',
  PUBLIC = 'PUBLIC',
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'Full-Stack Application Template' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'A comprehensive template for building full-stack applications' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: TemplateType, example: TemplateType.CUSTOM })
  @IsEnum(TemplateType)
  type!: TemplateType;

  @ApiProperty({
    description: 'Template content with sections and variables',
    type: 'object',
  })
  @IsObject()
  content!: any;

  @ApiPropertyOptional({ enum: TemplateAccessLevel, default: TemplateAccessLevel.PRIVATE })
  @IsOptional()
  @IsEnum(TemplateAccessLevel)
  accessLevel?: TemplateAccessLevel;

  @ApiPropertyOptional({ example: 'web-development' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: ['nodejs', 'react', 'typescript'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
