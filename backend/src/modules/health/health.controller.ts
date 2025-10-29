import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

/**
 * Health Check Controller
 * Provides endpoints for monitoring application health
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Basic health check endpoint
   */
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  check() {
    return this.healthService.check();
  }

  /**
   * Detailed health check with database and Redis status
   */
  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedCheck() {
    return this.healthService.detailedCheck();
  }

  /**
   * Readiness probe for orchestration platforms
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  async ready() {
    return this.healthService.readinessCheck();
  }

  /**
   * Liveness probe for orchestration platforms
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  live() {
    return this.healthService.livenessCheck();
  }
}
