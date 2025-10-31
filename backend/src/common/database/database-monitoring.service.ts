import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../modules/database/prisma.service';

interface QueryMetrics {
  queryId: string;
  query: string;
  duration: number;
  timestamp: Date;
  params?: unknown;
}

interface DatabaseMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  poolUtilization: number;
  avgQueryDuration: number;
  slowQueries: number;
  errorRate: number;
  totalQueries: number;
}

@Injectable()
export class DatabaseMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseMonitoringService.name);
  private queryMetrics: QueryMetrics[] = [];
  private metricsInterval: NodeJS.Timeout;
  private metrics: DatabaseMetrics = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    poolUtilization: 0,
    avgQueryDuration: 0,
    slowQueries: 0,
    errorRate: 0,
    totalQueries: 0,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const monitoringEnabled = this.configService.get('databaseOptimization.monitoring.enabled');
    if (monitoringEnabled) {
      await this.startMonitoring();
    }
  }

  private async startMonitoring() {
    this.logger.log('Starting database performance monitoring...');

    // Monitor queries
    this.prisma.$on('query' as never, (e: Record<string, unknown>) => {
      this.trackQuery({
        queryId: (e.id as string) || `query_${Date.now()}`,
        query: e.query as string,
        duration: e.duration as number,
        timestamp: new Date(),
        params: e.params,
      });
    });

    // Periodic metrics collection
    const interval = this.configService.get('databaseOptimization.monitoring.metricsInterval');
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);
  }

  private trackQuery(queryMetric: QueryMetrics) {
    this.queryMetrics.push(queryMetric);

    // Keep only last 1000 queries in memory
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log slow queries
    const slowQueryThreshold = this.configService.get(
      'databaseOptimization.queryOptimization.slowQueryThreshold',
    );

    if (queryMetric.duration > slowQueryThreshold) {
      this.logger.warn(
        `Slow query detected (${queryMetric.duration}ms): ${queryMetric.query.substring(0, 100)}...`,
      );
    }
  }

  private async collectMetrics() {
    try {
      // Calculate metrics from tracked queries
      const now = Date.now();
      const recentQueries = this.queryMetrics.filter(
        (q) => now - q.timestamp.getTime() < 60000, // Last minute
      );

      const slowQueryThreshold = this.configService.get(
        'databaseOptimization.queryOptimization.slowQueryThreshold',
      );

      this.metrics = {
        activeConnections: await this.getActiveConnections(),
        idleConnections: await this.getIdleConnections(),
        totalConnections: await this.getTotalConnections(),
        poolUtilization: await this.getPoolUtilization(),
        avgQueryDuration:
          recentQueries.length > 0
            ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length
            : 0,
        slowQueries: recentQueries.filter((q) => q.duration > slowQueryThreshold).length,
        errorRate: 0, // TODO: Implement error tracking
        totalQueries: recentQueries.length,
      };

      // Check alert thresholds
      this.checkAlertThresholds();
    } catch (error) {
      this.logger.error(`Error collecting database metrics: ${error.message}`);
    }
  }

  private async getActiveConnections(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE state = 'active' AND datname = current_database()
      `;
      return Number(result[0]?.count || 0);
    } catch {
      return 0;
    }
  }

  private async getIdleConnections(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE state = 'idle' AND datname = current_database()
      `;
      return Number(result[0]?.count || 0);
    } catch {
      return 0;
    }
  }

  private async getTotalConnections(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      return Number(result[0]?.count || 0);
    } catch {
      return 0;
    }
  }

  private async getPoolUtilization(): Promise<number> {
    const maxConnections = this.configService.get('databaseOptimization.pool.max');
    const totalConnections = await this.getTotalConnections();
    return maxConnections > 0 ? totalConnections / maxConnections : 0;
  }

  private checkAlertThresholds() {
    const thresholds = this.configService.get('databaseOptimization.monitoring.alertThresholds');

    if (this.metrics.poolUtilization > thresholds.connectionPoolUtilization) {
      this.logger.warn(
        `High connection pool utilization: ${(this.metrics.poolUtilization * 100).toFixed(2)}%`,
      );
    }

    if (this.metrics.avgQueryDuration > thresholds.queryDuration) {
      this.logger.warn(
        `High average query duration: ${this.metrics.avgQueryDuration.toFixed(2)}ms`,
      );
    }
  }

  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  getSlowQueries(limit = 10): QueryMetrics[] {
    const slowQueryThreshold = this.configService.get(
      'databaseOptimization.queryOptimization.slowQueryThreshold',
    );

    return this.queryMetrics
      .filter((q) => q.duration > slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  async analyzeQuery(query: string): Promise<unknown[]> {
    try {
      const result = await this.prisma.$queryRawUnsafe(`EXPLAIN ANALYZE ${query}`);
      return result as unknown[];
    } catch (error) {
      this.logger.error(
        `Error analyzing query: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  onModuleDestroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}
