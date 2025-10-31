'use client';

import { DashboardLayout } from '@/components/layout';
import { AnalyticsDashboard } from '@/components/dashboard';
import { useDashboardStore } from '@/store/dashboardStore';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { dashboardAPI } from '@/lib/api';

export default function AnalyticsPage() {
  const {
    providerPerformance,
    templateUsage,
    costAnalysis,
    roiMetrics,
    setProviderPerformance,
    setTemplateUsage,
    setCostAnalysis,
    setROIMetrics,
  } = useDashboardStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [providers, templates, costs, roi] = await Promise.all([
        dashboardAPI.getProviderPerformance(),
        dashboardAPI.getTemplateUsage(),
        dashboardAPI.getCostAnalysis('month'),
        dashboardAPI.getROIMetrics(),
      ]);

      setProviderPerformance(providers);
      setTemplateUsage(templates);
      setCostAnalysis(costs);
      setROIMetrics(roi);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchAnalyticsData();
    toast.success('Analytics refreshed');
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Detailed insights into your AI usage and performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard
          providerPerformance={providerPerformance}
          templateUsage={templateUsage}
          costAnalysis={costAnalysis}
          roiMetrics={roiMetrics}
        />
      </div>
    </DashboardLayout>
  );
}
