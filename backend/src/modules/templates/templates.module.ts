import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TemplateController } from './templates.controller';
import { TemplateService } from './services/template.service';
import { TemplateVersionService } from './services/template-version.service';
import { TemplateValidationService } from './services/template-validation.service';
import { TemplateRenderService } from './services/template-render.service';
import { TemplateSharingService } from './services/template-sharing.service';
import { TemplateCollaborationGateway } from './gateways/template-collaboration.gateway';

/**
 * TemplatesModule - Complete Template Management System
 * 
 * Features:
 * ✓ Template CRUD operations with pagination and filtering
 * ✓ Version control system with branching, merging, and rollback
 * ✓ Template validation engine with JSON schema and custom rules
 * ✓ Template rendering with variable interpolation and conditionals
 * ✓ Template sharing and permission management
 * ✓ Template marketplace with ratings and analytics
 * ✓ Real-time collaboration via WebSocket
 * ✓ Template forking and statistics
 */
@Module({
  imports: [DatabaseModule],
  controllers: [TemplateController],
  providers: [
    TemplateService,
    TemplateVersionService,
    TemplateValidationService,
    TemplateRenderService,
    TemplateSharingService,
    TemplateCollaborationGateway,
  ],
  exports: [
    TemplateService,
    TemplateVersionService,
    TemplateValidationService,
    TemplateRenderService,
    TemplateSharingService,
  ],
})
export class TemplatesModule {}
