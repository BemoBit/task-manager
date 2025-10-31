'use client';

import { DashboardLayout } from '@/components/layout';
import { KanbanBoard, TaskListView } from '@/components/dashboard';
import { useDashboardStore } from '@/store/dashboardStore';
import { Task } from '@/types/dashboard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';

export default function TasksPage() {
  const { tasks, updateTask } = useDashboardStore();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
  };

  const handleCreateTask = () => {
    // TODO: Implement task creation
    console.log('Create new task');
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
        {view === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleCreateTask}
          />
        ) : (
          <TaskListView
            tasks={tasks}
            filter={{}}
            sort={{ field: 'createdAt', direction: 'desc' }}
            selectedTasks={new Set()}
            onFilterChange={() => {}}
            onSortChange={() => {}}
            onTaskSelect={() => {}}
            onTaskSelectAll={() => {}}
            onBulkAction={() => {}}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
