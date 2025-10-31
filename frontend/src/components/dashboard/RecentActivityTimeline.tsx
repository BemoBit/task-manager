import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from '@/types/dashboard';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Brain, 
  FileDown,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecentActivityTimelineProps {
  activities: Activity[];
  className?: string;
  maxItems?: number;
}

const activityIcons = {
  task_created: Clock,
  task_completed: CheckCircle2,
  task_failed: XCircle,
  template_updated: FileText,
  ai_request: Brain,
  report_generated: FileDown,
};

const activityColors = {
  task_created: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
  task_completed: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950',
  task_failed: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
  template_updated: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950',
  ai_request: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950',
  report_generated: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950',
};

export function RecentActivityTimeline({ 
  activities, 
  className,
  maxItems = 10,
}: RecentActivityTimelineProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest updates and events in your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {displayedActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              displayedActivities.map((activity, index) => {
                const Icon = activityIcons[activity.type] || Clock;
                const colorClass = activityColors[activity.type] || 'text-gray-600 bg-gray-50';
                const isLast = index === displayedActivities.length - 1;

                return (
                  <div key={activity.id} className="relative flex gap-3">
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      colorClass
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none">
                            {activity.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <time dateTime={activity.timestamp.toISOString()}>
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {activities.length > maxItems && (
          <div className="mt-4 pt-4 border-t text-center">
            <button className="text-sm text-primary hover:underline">
              View all activity ({activities.length - maxItems} more)
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
