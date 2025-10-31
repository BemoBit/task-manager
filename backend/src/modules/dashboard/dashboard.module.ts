import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/**
 * DashboardModule - Dashboard Analytics and Statistics
 *
 * Provides comprehensive dashboard functionality:
 * - Task statistics and trends
 * - AI usage metrics and cost analysis
 * - Recent activities and notifications
 * - Provider performance analytics
 * - Template usage statistics
 * - ROI metrics and reporting
 */
@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
