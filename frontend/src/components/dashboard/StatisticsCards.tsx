import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStatistics } from '@/types/dashboard';
import { CheckCircle2, Circle, Clock, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatisticsCardsProps {
  statistics: TaskStatistics;
  className?: string;
}

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatisticsCards({ statistics, className }: StatisticsCardsProps) {
  const completionRate = statistics.total > 0
    ? ((statistics.completed / statistics.total) * 100).toFixed(1)
    : '0';

  const cards: StatCard[] = [
    {
      title: 'Total Tasks',
      value: statistics.total,
      icon: <Circle className="h-5 w-5" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Completed',
      value: statistics.completed,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      trend: {
        value: 12.5,
        isPositive: true,
      },
    },
    {
      title: 'In Progress',
      value: statistics.inProgress,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    },
    {
      title: 'Failed',
      value: statistics.failed,
      icon: <XCircle className="h-5 w-5" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      trend: {
        value: -8.2,
        isPositive: true,
      },
    },
  ];

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={cn('rounded-full p-2', card.bgColor)}>
              <div className={card.color}>{card.icon}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(card.value ?? 0).toLocaleString()}
            </div>
            {card.trend && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {card.trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={card.trend.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(card.trend.value)}%
                </span>
                <span>vs last period</span>
              </div>
            )}
            {card.title === 'Total Tasks' && (
              <p className="text-xs text-muted-foreground mt-1">
                {completionRate}% completion rate
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
