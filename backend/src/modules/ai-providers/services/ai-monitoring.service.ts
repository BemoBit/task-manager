import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AIProviderMetrics } from '../interfaces/ai-provider.interface';

interface UsageLog {
  providerId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service for monitoring and analytics of AI provider usage
 */
@Injectable()
export class AIMonitoringService {
  private readonly logger = new Logger(AIMonitoringService.name);
  private readonly metricsCache = new Map<string, AIProviderMetrics>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log AI request usage
   */
  async logUsage(usage: UsageLog): Promise<void> {
    try {
      // Update in-memory metrics
      const metrics = this.getOrCreateMetrics(usage.providerId);
      metrics.totalRequests++;

      if (usage.success) {
        metrics.successfulRequests++;
      } else {
        metrics.failedRequests++;
      }

      // Update average latency (moving average)
      metrics.averageLatency =
        (metrics.averageLatency * (metrics.totalRequests - 1) + usage.latency) /
        metrics.totalRequests;

      metrics.totalTokensUsed += usage.totalTokens;
      metrics.totalCost += usage.cost;
      metrics.lastUsed = usage.timestamp;
      metrics.errorRate = metrics.failedRequests / metrics.totalRequests;

      this.metricsCache.set(usage.providerId, metrics);

      // Optionally persist to database for long-term analytics
      // await this.persistUsageLog(usage);

      this.logger.debug(
        `Logged usage for provider ${usage.providerId}: ${usage.totalTokens} tokens, $${usage.cost.toFixed(4)}`,
      );
    } catch (error) {
      this.logger.error(`Failed to log usage: ${error.message}`);
    }
  }

  /**
   * Get metrics for a specific provider
   */
  getProviderMetrics(providerId: string): AIProviderMetrics {
    return (
      this.metricsCache.get(providerId) || {
        providerId,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        totalTokensUsed: 0,
        totalCost: 0,
        lastUsed: new Date(),
        errorRate: 0,
        uptime: 100,
      }
    );
  }

  /**
   * Get aggregated metrics for all providers
   */
  getAllMetrics(): AIProviderMetrics[] {
    return Array.from(this.metricsCache.values());
  }

  /**
   * Get usage statistics for a time period
   */
  async getUsageStatistics(
    startDate: Date,
    endDate: Date,
    providerId?: string,
  ): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageLatency: number;
    successRate: number;
    byProvider: Record<string, AIProviderMetrics>;
  }> {
    // In a real implementation, this would query the database
    // For now, return cached metrics
    const metrics = providerId ? [this.getProviderMetrics(providerId)] : this.getAllMetrics();

    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokensUsed, 0);
    const totalCost = metrics.reduce((sum, m) => sum + m.totalCost, 0);
    const averageLatency =
      metrics.reduce((sum, m) => sum + m.averageLatency, 0) / metrics.length || 0;
    const successfulRequests = metrics.reduce((sum, m) => sum + m.successfulRequests, 0);
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;

    const byProvider: Record<string, AIProviderMetrics> = {};
    for (const metric of metrics) {
      byProvider[metric.providerId] = metric;
    }

    return {
      totalRequests,
      totalTokens,
      totalCost,
      averageLatency,
      successRate,
      byProvider,
    };
  }

  /**
   * Get cost breakdown by provider
   */
  async getCostBreakdown(
    _startDate: Date,
    _endDate: Date,
  ): Promise<
    Array<{
      providerId: string;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
      averageCostPerRequest: number;
    }>
  > {
    const metrics = this.getAllMetrics();

    return metrics.map((m) => ({
      providerId: m.providerId,
      totalCost: m.totalCost,
      totalTokens: m.totalTokensUsed,
      requestCount: m.totalRequests,
      averageCostPerRequest: m.totalRequests > 0 ? m.totalCost / m.totalRequests : 0,
    }));
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<
    Array<{
      providerId: string;
      averageLatency: number;
      successRate: number;
      errorRate: number;
      uptime: number;
    }>
  > {
    const metrics = this.getAllMetrics();

    return metrics.map((m) => ({
      providerId: m.providerId,
      averageLatency: m.averageLatency,
      successRate: m.totalRequests > 0 ? m.successfulRequests / m.totalRequests : 0,
      errorRate: m.errorRate,
      uptime: m.uptime,
    }));
  }

  /**
   * Reset metrics for a provider
   */
  resetMetrics(providerId: string): void {
    this.metricsCache.delete(providerId);
    this.logger.log(`Reset metrics for provider: ${providerId}`);
  }

  /**
   * Reset all metrics
   */
  resetAllMetrics(): void {
    this.metricsCache.clear();
    this.logger.log('Reset all metrics');
  }

  /**
   * Get or create metrics object for a provider
   */
  private getOrCreateMetrics(providerId: string): AIProviderMetrics {
    if (!this.metricsCache.has(providerId)) {
      this.metricsCache.set(providerId, {
        providerId,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        totalTokensUsed: 0,
        totalCost: 0,
        lastUsed: new Date(),
        errorRate: 0,
        uptime: 100,
      });
    }
    return this.metricsCache.get(providerId)!;
  }

  /**
   * Persist usage log to database (optional for long-term storage)
   */
  private async persistUsageLog(usage: UsageLog): Promise<void> {
    try {
      // This would save to a dedicated usage_logs table
      // await this.prisma.aIUsageLog.create({ data: usage });
      this.logger.debug(`Persisted usage log for ${usage.providerId}`);
    } catch (error) {
      this.logger.error(`Failed to persist usage log: ${error.message}`);
    }
  }

  /**
   * Generate alerts based on usage patterns
   */
  async checkAlerts(): Promise<
    Array<{
      providerId: string;
      type: 'cost' | 'error_rate' | 'latency';
      message: string;
      severity: 'info' | 'warning' | 'critical';
    }>
  > {
    const alerts: Array<{
      providerId: string;
      type: 'cost' | 'error_rate' | 'latency';
      message: string;
      severity: 'info' | 'warning' | 'critical';
    }> = [];

    const metrics = this.getAllMetrics();

    for (const metric of metrics) {
      // Check error rate
      if (metric.errorRate > 0.5) {
        alerts.push({
          providerId: metric.providerId,
          type: 'error_rate',
          message: `High error rate: ${(metric.errorRate * 100).toFixed(1)}%`,
          severity: 'critical',
        });
      } else if (metric.errorRate > 0.2) {
        alerts.push({
          providerId: metric.providerId,
          type: 'error_rate',
          message: `Elevated error rate: ${(metric.errorRate * 100).toFixed(1)}%`,
          severity: 'warning',
        });
      }

      // Check latency
      if (metric.averageLatency > 10000) {
        alerts.push({
          providerId: metric.providerId,
          type: 'latency',
          message: `High latency: ${metric.averageLatency.toFixed(0)}ms`,
          severity: 'warning',
        });
      }

      // Check cost
      if (metric.totalCost > 100) {
        alerts.push({
          providerId: metric.providerId,
          type: 'cost',
          message: `High cost: $${metric.totalCost.toFixed(2)}`,
          severity: 'info',
        });
      }
    }

    return alerts;
  }
}
