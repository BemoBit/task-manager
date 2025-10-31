import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TaskStatus, PipelineState } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get task statistics
   */
  async getTaskStatistics() {
    try {
      const [
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        failedTasks,
        cancelledTasks,
        avgCompletionTime,
      ] = await Promise.all([
        this.prisma.task.count(),
        this.prisma.task.count({ where: { status: TaskStatus.COMPLETED } }),
        this.prisma.task.count({ where: { status: TaskStatus.IN_PROGRESS } }),
        this.prisma.task.count({ where: { status: TaskStatus.PENDING } }),
        this.prisma.task.count({ where: { status: TaskStatus.FAILED } }),
        this.prisma.task.count({ where: { status: TaskStatus.CANCELLED } }),
        this.calculateAvgCompletionTime(),
      ]);

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        failedTasks,
        cancelledTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        avgCompletionTime,
      };
    } catch (error) {
      this.logger.error('Error getting task statistics:', error);
      throw error;
    }
  }

  /**
   * Get AI usage metrics
   */
  async getAIUsageMetrics(startDate?: Date, endDate?: Date) {
    try {
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [totalRequests, successfulRequests, failedRequests, usageLogs] =
        await Promise.all([
          this.prisma.aIUsageLog.count({ where }),
          this.prisma.aIUsageLog.count({
            where: { ...where, success: true },
          }),
          this.prisma.aIUsageLog.count({
            where: { ...where, success: false },
          }),
          this.prisma.aIUsageLog.findMany({
            where,
            select: {
              tokensUsed: true,
              cost: true,
              duration: true,
            },
          }),
        ]);

      const totalTokens = usageLogs.reduce(
        (sum, log) => sum + (log.tokensUsed || 0),
        0,
      );
      const totalCost = usageLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
      const avgDuration =
        usageLogs.length > 0
          ? usageLogs.reduce((sum, log) => sum + (log.duration || 0), 0) /
            usageLogs.length
          : 0;

      const successRate =
        totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: Math.round(successRate * 100) / 100,
        totalTokens,
        totalCost: Math.round(totalCost * 100) / 100,
        avgDuration: Math.round(avgDuration),
      };
    } catch (error) {
      this.logger.error('Error getting AI usage metrics:', error);
      throw error;
    }
  }

  /**
   * Get recent activities
   */
  async getActivities(limit = 50) {
    try {
      const [tasks, auditLogs] = await Promise.all([
        this.prisma.task.findMany({
          take: Math.floor(limit / 2),
          orderBy: { updatedAt: 'desc' },
          include: {
            assignee: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        }),
        this.prisma.auditLog.findMany({
          take: Math.floor(limit / 2),
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        }),
      ]);

      const activities = [
        ...tasks.map((task) => ({
          id: task.id,
          type: 'task',
          action: `Task ${task.status.toLowerCase()}`,
          description: task.title,
          user: task.assignee
            ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() ||
              task.assignee.email
            : 'System',
          timestamp: task.updatedAt,
        })),
        ...auditLogs.map((log) => ({
          id: log.id,
          type: 'audit',
          action: log.action,
          description: `${log.resource} ${log.action}`,
          user: log.user
            ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() ||
              log.user.email
            : 'System',
          timestamp: log.createdAt,
        })),
      ];

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting activities:', error);
      throw error;
    }
  }

  /**
   * Get task trends
   */
  async getTaskTrends(period: 'week' | 'month' | 'quarter' | 'year' = 'week') {
    try {
      const now = new Date();
      const startDate = this.getStartDateForPeriod(period, now);

      const tasks = await this.prisma.task.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        select: {
          createdAt: true,
          completedAt: true,
          status: true,
        },
      });

      const trends = this.aggregateTasksByPeriod(tasks, period, startDate, now);
      return trends;
    } catch (error) {
      this.logger.error('Error getting task trends:', error);
      throw error;
    }
  }

  /**
   * Get provider performance
   */
  async getProviderPerformance() {
    try {
      const providers = await this.prisma.aIProvider.findMany({
        where: { isActive: true },
        include: {
          usageLogs: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      });

      return providers.map((provider) => {
        const logs = provider.usageLogs;
        const totalRequests = logs.length;
        const successfulRequests = logs.filter((log) => log.success).length;
        const avgDuration =
          logs.length > 0
            ? logs.reduce((sum, log) => sum + (log.duration || 0), 0) /
              logs.length
            : 0;
        const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

        return {
          id: provider.id,
          name: provider.name,
          type: provider.type,
          totalRequests,
          successfulRequests,
          successRate:
            totalRequests > 0
              ? Math.round((successfulRequests / totalRequests) * 100 * 100) / 100
              : 0,
          avgResponseTime: Math.round(avgDuration),
          totalCost: Math.round(totalCost * 100) / 100,
          isActive: provider.isActive,
        };
      });
    } catch (error) {
      this.logger.error('Error getting provider performance:', error);
      throw error;
    }
  }

  /**
   * Get template usage
   */
  async getTemplateUsage() {
    try {
      const templates = await this.prisma.template.findMany({
        where: { isActive: true, isDeleted: false },
        select: {
          id: true,
          name: true,
          type: true,
          usageCount: true,
          forkCount: true,
          rating: true,
          ratingCount: true,
        },
        orderBy: { usageCount: 'desc' },
        take: 20,
      });

      return templates.map((template) => ({
        id: template.id,
        name: template.name,
        type: template.type,
        usageCount: template.usageCount,
        forkCount: template.forkCount,
        avgRating: template.rating
          ? Math.round(template.rating * 100) / 100
          : null,
        totalRatings: template.ratingCount,
      }));
    } catch (error) {
      this.logger.error('Error getting template usage:', error);
      throw error;
    }
  }

  /**
   * Get cost analysis
   */
  async getCostAnalysis(period: 'month' | 'quarter' | 'year' = 'month') {
    try {
      const now = new Date();
      const startDate = this.getStartDateForPeriod(period, now);

      const usageLogs = await this.prisma.aIUsageLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        include: {
          provider: {
            select: { name: true, type: true },
          },
        },
      });

      const costByProvider = new Map<string, number>();
      const tokensByProvider = new Map<string, number>();

      usageLogs.forEach((log) => {
        const providerName = log.provider.name;
        costByProvider.set(
          providerName,
          (costByProvider.get(providerName) || 0) + (log.cost || 0),
        );
        tokensByProvider.set(
          providerName,
          (tokensByProvider.get(providerName) || 0) + (log.tokensUsed || 0),
        );
      });

      return Array.from(costByProvider.entries()).map(([provider, cost]) => ({
        provider,
        cost: Math.round(cost * 100) / 100,
        tokens: tokensByProvider.get(provider) || 0,
      }));
    } catch (error) {
      this.logger.error('Error getting cost analysis:', error);
      throw error;
    }
  }

  /**
   * Get ROI metrics
   */
  async getROIMetrics() {
    try {
      const [totalTasks, completedTasks, totalCost] = await Promise.all([
        this.prisma.task.count(),
        this.prisma.task.count({ where: { status: TaskStatus.COMPLETED } }),
        this.prisma.aIUsageLog.aggregate({
          _sum: { cost: true },
        }),
      ]);

      const cost = totalCost._sum.cost || 0;
      const completionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Estimate time saved (assuming each completed task saves 2 hours)
      const timeSavedHours = completedTasks * 2;
      // Estimate cost per task
      const costPerTask = totalTasks > 0 ? cost / totalTasks : 0;
      // Estimate ROI (assuming $50/hour labor cost)
      const laborCostSaved = timeSavedHours * 50;
      const roi = cost > 0 ? ((laborCostSaved - cost) / cost) * 100 : 0;

      return [
        {
          metric: 'Total Tasks',
          value: totalTasks,
          unit: 'tasks',
        },
        {
          metric: 'Completion Rate',
          value: Math.round(completionRate * 100) / 100,
          unit: '%',
        },
        {
          metric: 'Total Cost',
          value: Math.round(cost * 100) / 100,
          unit: 'USD',
        },
        {
          metric: 'Cost per Task',
          value: Math.round(costPerTask * 100) / 100,
          unit: 'USD',
        },
        {
          metric: 'Time Saved',
          value: timeSavedHours,
          unit: 'hours',
        },
        {
          metric: 'Estimated ROI',
          value: Math.round(roi * 100) / 100,
          unit: '%',
        },
      ];
    } catch (error) {
      this.logger.error('Error getting ROI metrics:', error);
      throw error;
    }
  }

  // Helper methods

  private async calculateAvgCompletionTime(): Promise<number> {
    const completedTasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.COMPLETED,
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      if (task.startedAt && task.completedAt) {
        return (
          sum + (task.completedAt.getTime() - task.startedAt.getTime()) / 1000
        );
      }
      return sum;
    }, 0);

    return Math.round(totalTime / completedTasks.length);
  }

  private getStartDateForPeriod(
    period: 'week' | 'month' | 'quarter' | 'year',
    now: Date,
  ): Date {
    const date = new Date(now);
    switch (period) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date;
  }

  private aggregateTasksByPeriod(
    tasks: any[],
    period: string,
    startDate: Date,
    endDate: Date,
  ) {
    const trends: any[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const nextDate = this.getNextDate(current, period);
      const periodTasks = tasks.filter(
        (task) =>
          task.createdAt >= current && task.createdAt < nextDate,
      );

      trends.push({
        date: current.toISOString().split('T')[0],
        created: periodTasks.length,
        completed: periodTasks.filter(
          (t) => t.status === TaskStatus.COMPLETED,
        ).length,
        failed: periodTasks.filter((t) => t.status === TaskStatus.FAILED)
          .length,
      });

      current.setTime(nextDate.getTime());
    }

    return trends;
  }

  private getNextDate(date: Date, period: string): Date {
    const next = new Date(date);
    switch (period) {
      case 'week':
        next.setDate(next.getDate() + 1);
        break;
      case 'month':
        next.setDate(next.getDate() + 1);
        break;
      case 'quarter':
        next.setDate(next.getDate() + 7);
        break;
      case 'year':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }
}
