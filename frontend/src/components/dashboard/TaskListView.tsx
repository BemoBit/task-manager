'use client';

import { useState } from 'react';
import { Task, TaskFilter, SortConfig } from '@/types/dashboard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  SortAsc,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskListViewProps {
  tasks: Task[];
  filter?: TaskFilter;
  sort?: SortConfig;
  selectedTasks?: Set<string>;
  onFilterChange?: (filter: TaskFilter) => void;
  onSortChange?: (sort: SortConfig) => void;
  onTaskSelect?: (taskId: string) => void;
  onTaskSelectAll?: (selected: boolean) => void;
  onTaskAction?: (action: string, taskId: string) => void;
  onBulkAction?: (action: string, taskIds: string[]) => void;
  className?: string;
}

export function TaskListView({
  tasks,
  filter = {},
  sort = { field: 'createdAt', direction: 'desc' },
  selectedTasks = new Set(),
  onFilterChange,
  onSortChange,
  onTaskSelect,
  onTaskSelectAll,
  onTaskAction,
  onBulkAction,
  className,
}: TaskListViewProps) {
  const [searchQuery, setSearchQuery] = useState(filter.search || '');
  const [showFilters, setShowFilters] = useState(false);

  const allSelected = tasks.length > 0 && selectedTasks.size === tasks.length;
  const someSelected = selectedTasks.size > 0 && !allSelected;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onFilterChange?.({ ...filter, search: value });
  };

  const handleStatusFilter = (status: string[]) => {
    onFilterChange?.({ ...filter, status });
  };

  const handlePriorityFilter = (priority: string[]) => {
    onFilterChange?.({ ...filter, priority });
  };

  const handleSort = (field: string) => {
    const newDirection = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange?.({ field, direction: newDirection });
  };

  const handleBulkAction = (action: string) => {
    onBulkAction?.(action, Array.from(selectedTasks));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SortAsc className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSort('createdAt')}>
                    Date Created
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('updatedAt')}>
                    Date Updated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('title')}>
                    Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('priority')}>
                    Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('dueDate')}>
                    Due Date
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Select
                  value={filter.status?.join(',') || ''}
                  onValueChange={(value) => handleStatusFilter(value.split(',').filter(Boolean))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filter.priority?.join(',') || ''}
                  onValueChange={(value) => handlePriorityFilter(value.split(',').filter(Boolean))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {selectedTasks.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('complete')}
                >
                  Complete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {/* Header Row */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 font-medium text-sm">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked: boolean | 'indeterminate') => onTaskSelectAll?.(checked === true)}
                className={cn(someSelected && 'data-[state=checked]:bg-muted-foreground')}
              />
              <div className="flex-1">Title</div>
              <div className="w-24">Status</div>
              <div className="w-24">Priority</div>
              <div className="w-32">Due Date</div>
              <div className="w-8"></div>
            </div>

            {/* Task Rows */}
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No tasks found
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => onTaskSelect?.(task.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {task.description}
                      </div>
                    )}
                  </div>

                  <Badge
                    variant={task.status === 'completed' ? 'default' : 'secondary'}
                    className="w-24 justify-center"
                  >
                    {task.status}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={cn('w-24 justify-center', {
                      'bg-red-50 text-red-700 dark:bg-red-950': task.priority === 'urgent',
                      'bg-orange-50 text-orange-700 dark:bg-orange-950': task.priority === 'high',
                      'bg-yellow-50 text-yellow-700 dark:bg-yellow-950': task.priority === 'medium',
                    })}
                  >
                    {task.priority}
                  </Badge>

                  <div className="w-32 text-sm text-muted-foreground">
                    {task.dueDate
                      ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })
                      : '—'}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onTaskAction?.('view', task.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTaskAction?.('edit', task.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onTaskAction?.('delete', task.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
