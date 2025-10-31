import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  FileText,
  PlayCircle,
  Download,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  className?: string;
  onAction?: (action: string) => void;
}

interface Action {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function QuickActions({ className, onAction }: QuickActionsProps) {
  const actions: Action[] = [
    {
      id: 'create-task',
      label: 'New Task',
      description: 'Create a new task',
      icon: <Plus className="h-5 w-5" />,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      id: 'create-template',
      label: 'New Template',
      description: 'Create a template',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    {
      id: 'run-pipeline',
      label: 'Run Pipeline',
      description: 'Execute pipeline',
      icon: <PlayCircle className="h-5 w-5" />,
      color: 'bg-green-600 hover:bg-green-700 text-white',
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      description: 'Create a report',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    {
      id: 'manage-team',
      label: 'Manage Team',
      description: 'Team settings',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'App settings',
      icon: <Settings className="h-5 w-5" />,
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
    },
  ];

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={cn(
                'h-auto flex-col gap-2 p-4',
                'hover:shadow-md transition-all'
              )}
              onClick={() => onAction?.(action.id)}
            >
              <div className={cn('rounded-lg p-2', action.color)}>
                {action.icon}
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">{action.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
