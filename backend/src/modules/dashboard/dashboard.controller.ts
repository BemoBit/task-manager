import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { DashboardService } from './dashboard.service';

/**
 * Dashboard Controller
 * REST API endpoints for dashboard analytics and statistics
 */
@ApiTags('Dashboard')
@Controller('dashboard')
@Public()
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get task statistics
   */
  @Get('statistics/tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task statistics retrieved successfully',
  })
  async getTaskStatistics() {
    this.logger.log('Getting task statistics');
    return this.dashboardService.getTaskStatistics();
  }

  /**
   * Get AI usage metrics
   */
  @Get('statistics/ai-usage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI usage metrics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI usage metrics retrieved successfully',
  })
  async getAIUsageMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log('Getting AI usage metrics');
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.dashboardService.getAIUsageMetrics(start, end);
  }

  /**
   * Get recent activities
   */
  @Get('activities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activities retrieved successfully',
  })
  async getActivities(@Query('limit') limit?: string) {
    this.logger.log('Getting recent activities');
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.dashboardService.getActivities(limitNum);
  }

  /**
   * Get task trends
   */
  @Get('analytics/task-trends')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get task trends over time' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['week', 'month', 'quarter', 'year'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task trends retrieved successfully',
  })
  async getTaskTrends(
    @Query('period') period?: 'week' | 'month' | 'quarter' | 'year',
  ) {
    this.logger.log(`Getting task trends for period: ${period || 'week'}`);
    return this.dashboardService.getTaskTrends(period || 'week');
  }

  /**
   * Get provider performance
   */
  @Get('analytics/provider-performance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI provider performance metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Provider performance retrieved successfully',
  })
  async getProviderPerformance() {
    this.logger.log('Getting provider performance');
    return this.dashboardService.getProviderPerformance();
  }

  /**
   * Get template usage
   */
  @Get('analytics/template-usage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get template usage statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template usage retrieved successfully',
  })
  async getTemplateUsage() {
    this.logger.log('Getting template usage');
    return this.dashboardService.getTemplateUsage();
  }

  /**
   * Get cost analysis
   */
  @Get('analytics/cost-analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cost analysis by provider' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['month', 'quarter', 'year'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cost analysis retrieved successfully',
  })
  async getCostAnalysis(
    @Query('period') period?: 'month' | 'quarter' | 'year',
  ) {
    this.logger.log(`Getting cost analysis for period: ${period || 'month'}`);
    return this.dashboardService.getCostAnalysis(period || 'month');
  }

  /**
   * Get ROI metrics
   */
  @Get('analytics/roi-metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get ROI metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'ROI metrics retrieved successfully',
  })
  async getROIMetrics() {
    this.logger.log('Getting ROI metrics');
    return this.dashboardService.getROIMetrics();
  }
}
