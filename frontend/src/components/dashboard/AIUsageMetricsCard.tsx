import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AIUsageMetrics } from '@/types/dashboard';
import { Brain, DollarSign, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIUsageMetricsCardProps {
  metrics: AIUsageMetrics;
  className?: string;
}

export function AIUsageMetricsCard({ metrics, className }: AIUsageMetricsCardProps) {
  const avgCostPerRequest = metrics.totalRequests > 0
    ? (metrics.totalCost / metrics.totalRequests).toFixed(4)
    : '0';

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const topProvider = Object.entries(metrics.requestsByProvider).reduce(
    (max, [provider, count]) => (count > max.count ? { provider, count } : max),
    { provider: 'N/A', count: 0 }
  );

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          AI Usage Metrics
        </CardTitle>
        <CardDescription>
          Overview of AI provider usage and costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              Total Requests
            </div>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalRequests)}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </div>
            <div className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4" />
              Total Tokens
            </div>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalTokens)}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Avg Response Time
            </div>
            <div className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg Cost per Request</span>
            <span className="font-medium">${avgCostPerRequest}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Top Provider</span>
            <span className="font-medium">{topProvider.provider}</span>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Provider Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(metrics.requestsByProvider).map(([provider, count]) => {
              const percentage = (count / metrics.totalRequests) * 100;
              const cost = metrics.costsByProvider[provider] || 0;
              
              return (
                <div key={provider} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{provider}</span>
                    <span className="text-muted-foreground">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      ${cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
