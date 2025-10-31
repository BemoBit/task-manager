import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { AIProviderRegistryService } from './services/ai-provider-registry.service';
import { AIRequestManagerService } from './services/ai-request-manager.service';
import { AIMonitoringService } from './services/ai-monitoring.service';
import { CreateProviderDto, UpdateProviderDto, CompletionRequestDto } from './dto/ai-provider.dto';
import { AIProviderStatus } from './interfaces/ai-provider.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Controller for AI provider management and execution
 */
@Controller('ai-providers')
export class AIProvidersController {
  constructor(
    private readonly providerRegistry: AIProviderRegistryService,
    private readonly requestManager: AIRequestManagerService,
    private readonly monitoring: AIMonitoringService,
  ) {}

  /**
   * Register a new AI provider
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProvider(@Body(ValidationPipe) dto: CreateProviderDto) {
    const config = {
      id: uuidv4(),
      ...dto,
      status: AIProviderStatus.ACTIVE,
      isActive: dto.isActive ?? true,
    };

    const provider = await this.providerRegistry.registerProvider(config);

    return {
      id: provider.config.id,
      name: provider.config.name,
      type: provider.type,
      model: provider.config.model,
      status: provider.config.status,
      isActive: provider.config.isActive,
    };
  }

  /**
   * Get all providers
   */
  @Get()
  async getAllProviders() {
    const providers = this.providerRegistry.getAllProviders();

    return providers.map((p) => ({
      id: p.config.id,
      name: p.config.name,
      type: p.type,
      model: p.config.model,
      status: p.config.status,
      isActive: p.config.isActive,
      priority: p.config.priority,
    }));
  }

  /**
   * Get a specific provider by ID
   */
  @Get(':id')
  async getProvider(@Param('id') id: string) {
    const provider = this.providerRegistry.getProvider(id);

    return {
      id: provider.config.id,
      name: provider.config.name,
      type: provider.type,
      model: provider.config.model,
      maxTokens: provider.config.maxTokens,
      temperature: provider.config.temperature,
      status: provider.config.status,
      isActive: provider.config.isActive,
      priority: provider.config.priority,
      endpoint: provider.config.endpoint,
      pricing: provider.config.pricing,
    };
  }

  /**
   * Update a provider
   */
  @Put(':id')
  async updateProvider(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateProviderDto) {
    const provider = await this.providerRegistry.updateProvider(id, dto);

    return {
      id: provider.config.id,
      name: provider.config.name,
      type: provider.type,
      model: provider.config.model,
      status: provider.config.status,
      isActive: provider.config.isActive,
    };
  }

  /**
   * Delete (deactivate) a provider
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProvider(@Param('id') id: string) {
    await this.providerRegistry.unregisterProvider(id);
  }

  /**
   * Health check for all providers
   */
  @Get('health/check')
  async healthCheck() {
    return this.providerRegistry.healthCheckAll();
  }

  /**
   * Send a completion request
   */
  @Post('complete')
  async complete(@Body(ValidationPipe) dto: CompletionRequestDto) {
    const request = {
      prompt: dto.prompt,
      systemPrompt: dto.systemPrompt,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      stream: dto.stream,
      metadata: dto.metadata,
    };

    const response = await this.requestManager.complete(request, dto.providerId);

    // Log usage
    await this.monitoring.logUsage({
      providerId: response.providerId,
      model: response.model,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      cost: response.cost?.totalCost || 0,
      latency: response.latency,
      success: true,
      timestamp: response.timestamp,
      metadata: dto.metadata,
    });

    return response;
  }

  /**
   * Get provider metrics
   */
  @Get('metrics/:id')
  async getProviderMetrics(@Param('id') id: string) {
    return this.monitoring.getProviderMetrics(id);
  }

  /**
   * Get all metrics
   */
  @Get('metrics')
  async getAllMetrics() {
    return this.monitoring.getAllMetrics();
  }

  /**
   * Get usage statistics
   */
  @Get('statistics/usage')
  async getUsageStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('providerId') providerId?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.monitoring.getUsageStatistics(start, end, providerId);
  }

  /**
   * Get cost breakdown
   */
  @Get('statistics/cost')
  async getCostBreakdown(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.monitoring.getCostBreakdown(start, end);
  }

  /**
   * Get performance metrics
   */
  @Get('statistics/performance')
  async getPerformanceMetrics() {
    return this.monitoring.getPerformanceMetrics();
  }

  /**
   * Get alerts
   */
  @Get('alerts')
  async getAlerts() {
    return this.monitoring.checkAlerts();
  }

  /**
   * Get request manager statistics
   */
  @Get('statistics/requests')
  async getRequestStatistics() {
    return this.requestManager.getStatistics();
  }
}
