import { IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IRenderContext } from '../interfaces/template.interface';

export class RenderTemplateDto {
  @ApiProperty({
    description: 'Template variables with their values',
    example: {
      projectName: 'My Project',
      database: 'PostgreSQL',
      authentication: true,
    },
  })
  @IsObject()
  variables!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Optional render context configuration',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  context?: Partial<IRenderContext>;
}
