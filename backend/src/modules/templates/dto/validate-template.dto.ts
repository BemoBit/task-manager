import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ITemplateContent } from '../interfaces/template.interface';

export class ValidateTemplateDto {
  @ApiProperty({
    description: 'Template content to validate',
    type: 'object',
  })
  @IsObject()
  content!: ITemplateContent;
}
