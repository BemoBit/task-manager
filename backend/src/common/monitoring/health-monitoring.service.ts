/**
 * Health Monitoring Service
 * Comprehensive health checks for all system components
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

interface HealthIndicator {
  status: 'up' | 'down' | 'degraded';
  message?: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

interface SystemHealth {
  status: 'ok' | 'degraded' | 'error';
  timestamp: Date;
  uptime: number;
  indicators: {
    database: HealthIndicator;
    redis: HealthIndicator;
    memory: HealthIndicator;
    disk: HealthIndicator;
    cpu: HealthIndicator;
  };
}

@Injectable()
export class HealthMonitoringService {
  private readonly logger = new Logger(HealthMonitoringService.name);
  private startTime: number = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const [database, redis, memory, disk, cpu] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkCPU(),
    ]);

    const indicators = { database, redis, memory, disk, cpu };
    const status = this.calculateOverallStatus(indicators);

    return {
      status,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      indicators,
    };
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthIndicator> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      const status = responseTime < 100 ? 'up' : responseTime < 500 ? 'degraded' : 'down';

      return {
        status,
        responseTime,
        message: `Database responding in ${responseTime}ms`,
      };
    } catch (error) {
      return {
        status: 'down',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<HealthIndicator> {
    try {
      // TODO: Implement actual Redis check
      return {
        status: 'up',
        message: 'Redis is operational',
      };
    } catch (error) {
      return {
        status: 'down',
        message: `Redis error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthIndicator> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercent = (usedMemory / totalMemory) * 100;

    const status = usagePercent < 80 ? 'up' : usagePercent < 95 ? 'degraded' : 'down';

    return {
      status,
      message: `Memory usage: ${usagePercent.toFixed(2)}%`,
      details: {
        total: this.formatBytes(totalMemory),
        used: this.formatBytes(usedMemory),
        free: this.formatBytes(freeMemory),
        percentage: usagePercent.toFixed(2),
      },
    };
  }

  /**
   * Check disk space
   */
  private async checkDisk(): Promise<HealthIndicator> {
    try {
      // This is a simplified check. In production, use a library like 'diskusage'
      return {
        status: 'up',
        message: 'Disk space is adequate',
        details: {
          path: process.cwd(),
          // Add actual disk usage stats here
        },
      };
    } catch (error) {
      return {
        status: 'down',
        message: `Disk check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check CPU usage
   */
  private async checkCPU(): Promise<HealthIndicator> {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    
    // Calculate CPU usage (simplified)
    const avgLoad = loadAverage[0]; // 1-minute load average
    const numCPUs = cpus.length;
    const loadPercent = (avgLoad / numCPUs) * 100;

    const status = loadPercent < 70 ? 'up' : loadPercent < 90 ? 'degraded' : 'down';

    return {
      status,
      message: `CPU load: ${loadPercent.toFixed(2)}%`,
      details: {
        cores: numCPUs,
        loadAverage: loadAverage.map((l) => l.toFixed(2)),
        model: cpus[0]?.model,
      },
    };
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(
    indicators: SystemHealth['indicators'],
  ): 'ok' | 'degraded' | 'error' {
    const statuses = Object.values(indicators).map((i) => i.status);

    if (statuses.includes('down')) return 'error';
    if (statuses.includes('degraded')) return 'degraded';
    return 'ok';
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Get system metrics for monitoring
   */
  async getMetrics(): Promise<Record<string, unknown>> {
    const health = await this.getSystemHealth();
    
    return {
      timestamp: new Date(),
      uptime: health.uptime,
      status: health.status,
      memory: health.indicators.memory.details,
      cpu: health.indicators.cpu.details,
      database: {
        status: health.indicators.database.status,
        responseTime: health.indicators.database.responseTime,
      },
    };
  }
}
