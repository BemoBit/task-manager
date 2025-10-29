import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForkTemplateDto {
  @ApiProperty({ example: 'My Fork of Original Template' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Modified version with additional features' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class RollbackVersionDto {
  @ApiProperty({ example: 'abc-123-version-id' })
  @IsString()
  versionId!: string;

  @ApiPropertyOptional({ example: 'Reverting to stable version' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ShareTemplateDto {
  @ApiProperty({ example: 'user-id-to-share-with' })
  @IsString()
  userId!: string;

  @ApiProperty({ enum: ['VIEW', 'EDIT', 'ADMIN'], example: 'VIEW' })
  @IsString()
  permission!: 'VIEW' | 'EDIT' | 'ADMIN';

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class RateTemplateDto {
  @ApiProperty({ example: 4.5, minimum: 0, maximum: 5 })
  rating!: number;

  @ApiPropertyOptional({ example: 'Great template, very useful!' })
  @IsOptional()
  @IsString()
  comment?: string;
}
