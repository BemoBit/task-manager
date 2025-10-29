import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * Health Service
 * Performs health checks on various system components
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime: Date;

  constructor(private readonly prisma: PrismaService) {
    this.startTime = new Date();
  }

  /**
   * Basic health check
   */
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Detailed health check with database and Redis status
   */
  async detailedCheck() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    const [databaseCheck, memoryCheck] = checks;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      startTime: this.startTime.toISOString(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: databaseCheck.status === 'fulfilled' ? databaseCheck.value : { status: 'error', error: (databaseCheck as PromiseRejectedResult).reason.message },
        memory: memoryCheck.status === 'fulfilled' ? memoryCheck.value : { status: 'error' },
      },
    };
  }

  /**
   * Readiness check - checks if application is ready to serve traffic
   */
  async readinessCheck() {
    try {
      await this.checkDatabase();
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      throw error;
    }
  }

  /**
   * Liveness check - simple check if application is running
   */
  livenessCheck() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        message: 'Database connection is working',
      };
    } catch (error) {
      this.logger.error('Database check failed', error);
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory() {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    return {
      status: 'healthy',
      usage: memoryUsageMB,
      unit: 'MB',
    };
  }
}
