import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { TemplateService } from './services/template.service';
import { TemplateVersionService } from './services/template-version.service';
import { TemplateValidationService } from './services/template-validation.service';
import { TemplateRenderService } from './services/template-render.service';
import { TemplateSharingService } from './services/template-sharing.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplatesDto } from './dto/query-templates.dto';
import { ValidateTemplateDto } from './dto/validate-template.dto';
import { RenderTemplateDto } from './dto/render-template.dto';
import {
  ForkTemplateDto,
  RollbackVersionDto,
  ShareTemplateDto,
  RateTemplateDto,
} from './dto/template-actions.dto';

@ApiTags('templates')
@ApiBearerAuth()
@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly versionService: TemplateVersionService,
    private readonly validationService: TemplateValidationService,
    private readonly renderService: TemplateRenderService,
    private readonly sharingService: TemplateSharingService,
  ) {}

  @Public() // Temporarily public for development
  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async create(@Request() req: any, @Body() dto: CreateTemplateDto) {
    // For development, use a default user ID if not authenticated
    const userId = req.user?.userId || 'dev-user-id';
    return this.templateService.create(userId, dto);
  }

  @Public() // Temporarily public for development
  @Get()
  @ApiOperation({ summary: 'Get all templates with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async findAll(@Request() req: any, @Query() query: QueryTemplatesDto) {
    // For development, use a default user ID if not authenticated
    const userId = req.user?.userId || 'dev-user-id';
    return this.templateService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string,
    @Query('version') version?: string,
  ) {
    return this.templateService.findOne(id, req.user.userId, version);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templateService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a template (soft delete)' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.templateService.remove(id, req.user.userId);
  }

  // ===== Version Control Endpoints =====

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a template' })
  @ApiResponse({ status: 200, description: 'Versions retrieved successfully' })
  async getVersions(@Param('id') id: string, @Query('branch') branch?: string) {
    return this.versionService.getVersions(id, branch);
  }

  @Get(':id/versions/:versionId')
  @ApiOperation({ summary: 'Get a specific version' })
  @ApiResponse({ status: 200, description: 'Version retrieved successfully' })
  async getVersion(@Param('versionId') versionId: string) {
    return this.versionService.getVersion(versionId);
  }

  @Post(':id/versions/branch')
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  async createBranch(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { branchName: string; fromVersion: string },
  ) {
    return this.versionService.createBranch(
      id,
      body.branchName,
      body.fromVersion,
      req.user.userId,
    );
  }

  @Post(':id/versions/merge')
  @ApiOperation({ summary: 'Merge a branch into target branch' })
  @ApiResponse({ status: 200, description: 'Branch merged successfully' })
  async mergeBranch(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { sourceBranch: string; targetBranch: string },
  ) {
    return this.versionService.mergeBranch(
      id,
      body.sourceBranch,
      body.targetBranch,
      req.user.userId,
    );
  }

  @Post(':id/versions/compare')
  @ApiOperation({ summary: 'Compare two versions' })
  @ApiResponse({ status: 200, description: 'Versions compared successfully' })
  async compareVersions(
    @Body() body: { versionId1: string; versionId2: string },
  ) {
    return this.versionService.compareVersions(body.versionId1, body.versionId2);
  }

  @Get(':id/versions/tree')
  @ApiOperation({ summary: 'Get version tree' })
  @ApiResponse({ status: 200, description: 'Version tree retrieved successfully' })
  async getVersionTree(@Param('id') id: string) {
    return this.versionService.getVersionTree(id);
  }

  @Post(':id/rollback')
  @ApiOperation({ summary: 'Rollback to a specific version' })
  @ApiResponse({ status: 200, description: 'Template rolled back successfully' })
  async rollback(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: RollbackVersionDto,
  ) {
    return this.versionService.rollback(id, dto.versionId, req.user.userId, dto.reason);
  }

  // ===== Validation and Rendering Endpoints =====

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate template content' })
  @ApiResponse({ status: 200, description: 'Validation completed' })
  async validate(@Body() dto: ValidateTemplateDto) {
    return this.validationService.validate(dto.content);
  }

  @Post(':id/render')
  @ApiOperation({ summary: 'Render template with provided variables' })
  @ApiResponse({ status: 200, description: 'Template rendered successfully' })
  async render(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: RenderTemplateDto,
  ) {
    const template = await this.templateService.findOne(id, req.user.userId);
    return this.renderService.render(template.content as any, {
      variables: dto.variables as Record<string, any>,
      ...dto.context,
    });
  }

  // ===== Template Actions Endpoints =====

  @Post(':id/fork')
  @ApiOperation({ summary: 'Fork a template' })
  @ApiResponse({ status: 201, description: 'Template forked successfully' })
  async fork(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ForkTemplateDto,
  ) {
    return this.templateService.fork(id, req.user.userId, dto);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate a template' })
  @ApiResponse({ status: 200, description: 'Template rated successfully' })
  async rate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: RateTemplateDto,
  ) {
    return this.templateService.rate(id, req.user.userId, dto);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get template statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Request() req: any, @Param('id') id: string) {
    return this.templateService.getStats(id, req.user.userId);
  }

  // ===== Sharing Endpoints =====

  @Post(':id/share')
  @ApiOperation({ summary: 'Share template with a user' })
  @ApiResponse({ status: 200, description: 'Template shared successfully' })
  async share(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ShareTemplateDto,
  ) {
    return this.sharingService.shareTemplate(id, req.user.userId, dto);
  }

  @Delete(':id/share/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke user access to template' })
  @ApiResponse({ status: 204, description: 'Access revoked successfully' })
  async revokeAccess(
    @Request() req: any,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.sharingService.revokeAccess(id, req.user.userId, targetUserId);
  }

  @Get(':id/shared-users')
  @ApiOperation({ summary: 'Get all users with access to template' })
  @ApiResponse({ status: 200, description: 'Shared users retrieved successfully' })
  async getSharedUsers(@Request() req: any, @Param('id') id: string) {
    return this.sharingService.getSharedUsers(id, req.user.userId);
  }

  @Get('shared/with-me')
  @ApiOperation({ summary: 'Get templates shared with current user' })
  @ApiResponse({ status: 200, description: 'Shared templates retrieved successfully' })
  async getSharedTemplates(@Request() req: any) {
    return this.sharingService.getSharedTemplates(req.user.userId);
  }

  @Put(':id/access-level')
  @ApiOperation({ summary: 'Update template access level' })
  @ApiResponse({ status: 200, description: 'Access level updated successfully' })
  async updateAccessLevel(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { accessLevel: 'PRIVATE' | 'SHARED' | 'PUBLIC' },
  ) {
    return this.sharingService.updateAccessLevel(id, req.user.userId, body.accessLevel);
  }

  @Post(':id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer template ownership' })
  @ApiResponse({ status: 200, description: 'Ownership transferred successfully' })
  async transferOwnership(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { newOwnerId: string },
  ) {
    return this.sharingService.transferOwnership(id, req.user.userId, body.newOwnerId);
  }
}
