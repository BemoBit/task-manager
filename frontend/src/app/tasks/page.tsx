'use client';

import { DashboardLayout } from '@/components/layout';
import { KanbanBoard, TaskListView } from '@/components/dashboard';
import { CreateTaskDialog } from '@/components/dialogs/CreateTaskDialog';
import { TaskDetailDialog } from '@/components/dialogs/TaskDetailDialog';
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog';
import { useDashboardStore } from '@/store/dashboardStore';
import { Task } from '@/types/dashboard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import { taskAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function TasksPage() {
  const { tasks, setTasks, updateTask } = useDashboardStore();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    search?: string;
    status?: string[];
    priority?: string[];
  }>({});
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc',
  });
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Extract unique users from tasks
  const existingUsers = Array.from(
    new Set(tasks.map(t => t.assignedTo).filter((u): u is string => !!u))
  ).sort();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTasks();
      
      // Map backend status format to frontend format
      const mappedTasks = (response.tasks || []).map(task => ({
        ...task,
        status: mapBackendStatus(task.status),
        priority: mapBackendPriority(task.priority),
      }));
      
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Map backend status (PENDING, IN_PROGRESS) to frontend (pending, in-progress)
  const mapBackendStatus = (status: string | Task['status']): Task['status'] => {
    const statusMap: Record<string, Task['status']> = {
      'PENDING': 'pending',
      'IN_PROGRESS': 'in-progress',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
    };
    return statusMap[status] || status as Task['status'] || 'pending';
  };

  // Map backend priority (number) to frontend (string)
  const mapBackendPriority = (priority: number | Task['priority']): Task['priority'] => {
    if (typeof priority === 'number') {
      const priorityMap: Record<number, Task['priority']> = {
        1: 'low',
        2: 'medium',
        3: 'high',
        4: 'urgent',
      };
      return priorityMap[priority] || 'medium';
    }
    return priority;
  };

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>, showToast = true) => {
    console.log('handleTaskUpdate called:', { taskId, updates, showToast });
    
    // Store original task for revert if needed
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) {
      console.error('Task not found:', taskId);
      if (showToast) toast.error('Task not found');
      return;
    }

    console.log('Original task:', originalTask);

    try {
      // Optimistically update UI first
      updateTask(taskId, updates);
      console.log('Optimistic update applied');

      // Map frontend status to backend format
      const backendUpdates: Record<string, unknown> = {};
      
      if (updates.status) {
        backendUpdates.status = mapFrontendToBackendStatus(updates.status);
      }
      if (updates.priority) {
        backendUpdates.priority = mapFrontendToBackendPriority(updates.priority);
      }
      if (updates.title !== undefined) backendUpdates.title = updates.title;
      if (updates.description !== undefined) backendUpdates.description = updates.description;
      if (updates.dueDate !== undefined) backendUpdates.dueDate = updates.dueDate;
      if (updates.assignedTo !== undefined) backendUpdates.assignedTo = updates.assignedTo;

      console.log('Backend updates:', backendUpdates);

      // Update in backend
      const updatedTask = await taskAPI.updateTask(taskId, backendUpdates);
      console.log('Backend response:', updatedTask);
      
      // Map backend response back to frontend format and update
      const mappedTask = {
        ...updatedTask,
        status: mapBackendStatus(updatedTask.status),
        priority: mapBackendPriority(updatedTask.priority),
      };
      updateTask(taskId, mappedTask);
      console.log('Final mapped task:', mappedTask);
      
      if (showToast) toast.success('Task updated successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      if (showToast) toast.error('Failed to update task');
      
      // Revert to original state
      updateTask(taskId, originalTask);
      console.log('Reverted to original task');
      throw error; // Re-throw for caller to handle
    }
  };

  // Map frontend status to backend format
  const mapFrontendToBackendStatus = (status: Task['status']): string => {
    const statusMap: Record<Task['status'], string> = {
      'pending': 'PENDING',
      'in-progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'failed': 'FAILED',
    };
    return statusMap[status] || status;
  };

  // Map frontend priority to backend format
  const mapFrontendToBackendPriority = (priority: Task['priority']): number => {
    const priorityMap: Record<Task['priority'], number> = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'urgent': 4,
    };
    return priorityMap[priority] || 2;
  };

  const handleCreateTask = () => {
    setCreateDialogOpen(true);
  };

  const handleTaskCreated = () => {
    fetchTasks();
  };

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = [...tasks];

    // Apply search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter((task) => filter.status?.includes(task.status));
    }

    // Apply priority filter
    if (filter.priority && filter.priority.length > 0) {
      filtered = filtered.filter((task) => filter.priority?.includes(task.priority));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority': {
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const handleTaskView = (taskId: string) => {
    console.log('handleTaskView called with:', taskId);
    const task = tasks.find(t => t.id === taskId);
    console.log('Found task:', task);
    if (task) {
      setSelectedTask(task);
      setViewDialogOpen(true);
      console.log('Dialog should open');
    } else {
      toast.error('Task not found');
    }
  };

  const handleTaskEdit = (taskId: string) => {
    console.log('handleTaskEdit called with:', taskId);
    const task = tasks.find(t => t.id === taskId);
    console.log('Found task:', task);
    if (task) {
      setSelectedTask(task);
      setEditDialogOpen(true);
      console.log('Edit dialog should open');
    } else {
      toast.error('Task not found');
    }
  };

  const handleTaskSave = async (taskId: string, updates: Partial<Task>) => {
    try {
      await handleTaskUpdate(taskId, updates, false); // Don't show toast from handleTaskUpdate
      // Toast will be shown by EditTaskDialog
    } catch (error) {
      // Error handling and toast already done in EditTaskDialog
      throw error;
    }
  };

  const handleTaskDuplicate = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const duplicatedTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        title: `${task.title} (Copy)`,
        description: task.description,
        status: 'pending',
        priority: task.priority,
        tags: task.tags,
        dueDate: task.dueDate,
        progress: 0,
        subtasks: [],
        dependencies: [],
        assignedTo: task.assignedTo,
        templateId: task.templateId,
      };

      await taskAPI.createTask(duplicatedTask);
      toast.success('Task duplicated successfully');
      fetchTasks();
    } catch (error) {
      console.error('Failed to duplicate task:', error);
      toast.error('Failed to duplicate task');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        toast.error('Task not found');
        return;
      }

      if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading('Deleting task...');
      
      await taskAPI.deleteTask(taskId);
      
      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success('Task deleted successfully');
      
      // Immediately update local state
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error: unknown) {
      console.error('Failed to delete task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      toast.error(errorMessage);
      // Refresh to get accurate state
      fetchTasks();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your tasks in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')}>
              <TabsList>
                <TabsTrigger value="kanban" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading tasks...</div>
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleCreateTask}
            onTaskView={handleTaskView}
            onTaskEdit={handleTaskEdit}
            onTaskDuplicate={handleTaskDuplicate}
            onTaskDelete={handleTaskDelete}
          />
        ) : (
          <TaskListView
            tasks={getFilteredAndSortedTasks()}
            filter={filter}
            sort={sort}
            selectedTasks={selectedTasks}
            onFilterChange={setFilter}
            onSortChange={setSort}
            onTaskSelect={(taskId) => {
              const newSelected = new Set(selectedTasks);
              if (newSelected.has(taskId)) {
                newSelected.delete(taskId);
              } else {
                newSelected.add(taskId);
              }
              setSelectedTasks(newSelected);
            }}
            onTaskSelectAll={(selected) => {
              if (selected) {
                setSelectedTasks(new Set(getFilteredAndSortedTasks().map(t => t.id)));
              } else {
                setSelectedTasks(new Set());
              }
            }}
            onTaskAction={(action, taskId) => {
              if (action === 'view') handleTaskView(taskId);
              else if (action === 'edit') handleTaskEdit(taskId);
              else if (action === 'delete') handleTaskDelete(taskId);
            }}
            onBulkAction={async (action, taskIds) => {
              if (action === 'delete') {
                if (!confirm(`Are you sure you want to delete ${taskIds.length} tasks?`)) {
                  return;
                }
                try {
                  await Promise.all(taskIds.map(id => taskAPI.deleteTask(id)));
                  toast.success(`${taskIds.length} tasks deleted successfully`);
                  setSelectedTasks(new Set());
                  fetchTasks();
                } catch (error) {
                  console.error('Failed to delete tasks:', error);
                  toast.error('Failed to delete tasks');
                }
              } else if (action === 'complete') {
                try {
                  await Promise.all(
                    taskIds.map(id => handleTaskUpdate(id, { status: 'completed' }))
                  );
                  toast.success(`${taskIds.length} tasks marked as completed`);
                  setSelectedTasks(new Set());
                } catch (error) {
                  console.error('Failed to update tasks:', error);
                  toast.error('Failed to update tasks');
                }
              }
            }}
          />
        )}

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleTaskCreated}
        />

        {/* View Task Detail Dialog */}
        <TaskDetailDialog
          task={selectedTask}
          open={viewDialogOpen}
          onOpenChange={(open) => {
            setViewDialogOpen(open);
            if (!open) setSelectedTask(null);
          }}
        />

        {/* Edit Task Dialog */}
        <EditTaskDialog
          task={selectedTask}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedTask(null);
          }}
          onSave={handleTaskSave}
          existingUsers={existingUsers}
        />
      </div>
    </DashboardLayout>
  );
}
