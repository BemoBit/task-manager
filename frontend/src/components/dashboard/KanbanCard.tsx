import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface KanbanCardProps {
  task: Task;
  isDragging?: boolean;
  onView?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDuplicate?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

const priorityColors = {
  low: 'bg-gray-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function KanbanCard({ task, isDragging, onView, onEdit, onDuplicate, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Menu item clicked, executing action');
    action();
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          'cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50 rotate-3 shadow-xl',
          isOverdue && 'border-red-500'
        )}
        {...listeners}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
              {task.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => handleMenuClick(e, () => onView?.(task.id))}
                >
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => handleMenuClick(e, () => onEdit?.(task.id))}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => handleMenuClick(e, () => onDuplicate?.(task.id))}
                >
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => handleMenuClick(e, () => onDelete?.(task.id))}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Priority Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={cn('text-xs', priorityColors[task.priority])}
          >
            {priorityLabels[task.priority]}
          </Badge>
          
          {task.tags && task.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          
          {task.tags && task.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{task.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Progress */}
        {task.progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-1.5" />
          </div>
        )}

        {/* Subtasks Counter */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>
              {task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length} subtasks
            </span>
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className={cn(
            'flex items-center gap-2 text-xs',
            isOverdue ? 'text-red-600' : 'text-muted-foreground'
          )}>
            {isOverdue ? (
              <AlertCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            <span>
              {isOverdue ? 'Overdue: ' : 'Due '}
              {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Assigned To */}
        {task.assignedTo && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
              {task.assignedTo.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground">{task.assignedTo}</span>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
