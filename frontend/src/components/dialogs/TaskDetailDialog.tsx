'use client';

import { Task } from '@/types/dashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Clock,
  Tag,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const statusColors = {
  pending: 'bg-gray-500',
  'in-progress': 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

const statusLabels = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
};

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{task.title}</DialogTitle>
          <DialogDescription>
            Task ID: {task.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-2">
            <Badge className={cn('text-white', statusColors[task.status])}>
              {statusLabels[task.status]}
            </Badge>
            <Badge className={cn('text-white', priorityColors[task.priority])}>
              {priorityLabels[task.priority]}
            </Badge>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
          )}

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assigned To */}
            {task.assignedTo && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Assigned To</div>
                  <div className="font-medium">{task.assignedTo}</div>
                </div>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className={cn('flex items-center gap-2', isOverdue && 'text-red-600')}>
                {isOverdue ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <div className="text-xs text-muted-foreground">Due Date</div>
                  <div className="font-medium">
                    {format(new Date(task.dueDate), 'PPP')}
                    <span className="text-xs ml-2">
                      ({formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="font-medium">
                  {format(new Date(task.createdAt), 'PPP')}
                </div>
              </div>
            </div>

            {/* Updated At */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Last Updated</div>
                <div className="font-medium">
                  {format(new Date(task.updatedAt), 'PPP')}
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          {task.progress > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Progress</h3>
                <span className="text-sm font-medium">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">
                  Subtasks ({task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length})
                </h3>
              </div>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-2 rounded border"
                  >
                    <CheckCircle2
                      className={cn(
                        'h-4 w-4',
                        subtask.status === 'completed' ? 'text-green-500' : 'text-gray-300'
                      )}
                    />
                    <span className={cn(
                      subtask.status === 'completed' && 'line-through text-muted-foreground'
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies && task.dependencies.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Dependencies</h3>
              <div className="space-y-1">
                {task.dependencies.map((depId) => (
                  <div key={depId} className="text-sm text-muted-foreground">
                    Task ID: {depId}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
