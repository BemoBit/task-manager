'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { dashboardAPI } from '@/lib/api';
import { StatisticsCards } from '@/components/dashboard/StatisticsCards';
import { AIUsageMetricsCard } from '@/components/dashboard/AIUsageMetricsCard';
import { RecentActivityTimeline } from '@/components/dashboard/RecentActivityTimeline';
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const {
    taskStatistics,
    aiUsageMetrics,
    activities,
    taskTrends,
    setTaskStatistics,
    setAIUsageMetrics,
    setActivities,
    setTaskTrends,
    isLoading,
    setLoading,
    setError,
  } = useDashboardStore();

  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stats, metrics, acts, trends] = await Promise.all([
        dashboardAPI.getTaskStatistics(),
        dashboardAPI.getAIUsageMetrics(),
        dashboardAPI.getActivities(20),
        dashboardAPI.getTaskTrends('week'),
      ]);

      setTaskStatistics(stats);
      setAIUsageMetrics(metrics);
      setActivities(acts);
      setTaskTrends(trends);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  // Quick action handler
  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    toast.info(`Action: ${action}`);
    // TODO: Implement actual action handling
  };

  // Export dashboard data
  const handleExport = () => {
    console.log('Exporting dashboard data...');
    toast.info('Export functionality coming soon');
    // TODO: Implement export functionality
  };

  if (isLoading && !taskStatistics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here&apos;s an overview of your workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {taskStatistics && (
          <StatisticsCards statistics={taskStatistics} />
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* AI Usage Metrics - Takes 2 columns on large screens */}
          {aiUsageMetrics && (
            <div className="lg:col-span-2">
              <AIUsageMetricsCard metrics={aiUsageMetrics} />
            </div>
          )}

          {/* Quick Actions */}
          <QuickActions onAction={handleQuickAction} />
        </div>

        {/* Performance Charts - Full width */}
        {taskTrends.length > 0 && (
          <PerformanceCharts taskTrends={taskTrends} />
        )}

        {/* Recent Activity */}
        {activities.length > 0 && (
          <RecentActivityTimeline activities={activities} />
        )}
      </div>
    </DashboardLayout>
  );
}
