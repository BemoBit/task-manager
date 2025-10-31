'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@/types/dashboard';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate?: () => void;
  onTaskView?: (taskId: string) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDuplicate?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  className?: string;
}

const columns = [
  { id: 'pending', title: 'Pending', color: 'bg-gray-100 dark:bg-gray-900' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-950' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100 dark:bg-green-950' },
  { id: 'failed', title: 'Failed', color: 'bg-red-100 dark:bg-red-950' },
];

export function KanbanBoard({ 
  tasks, 
  onTaskUpdate, 
  onTaskCreate,
  onTaskView,
  onTaskEdit,
  onTaskDuplicate,
  onTaskDelete,
  className 
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;

    console.log('Drag ended:', { taskId, overId });

    // Check if dropped on a column (column IDs are: pending, in-progress, completed, failed)
    const targetColumn = columns.find((col) => col.id === overId);
    
    if (targetColumn) {
      // Dropped directly on column
      console.log('Dropped on column:', targetColumn.id);
      onTaskUpdate(taskId, { status: targetColumn.id as Task['status'] });
    } else {
      // Dropped on another task - find which column that task is in
      const targetTask = tasks.find((t) => t.id === overId);
      if (targetTask && targetTask.status !== activeTask?.status) {
        console.log('Dropped on task in column:', targetTask.status);
        onTaskUpdate(taskId, { status: targetTask.status });
      }
    }

    setActiveTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Task Board</h2>
          <p className="text-muted-foreground">Drag and drop to update task status</p>
        </div>
        {onTaskCreate && (
          <Button onClick={onTaskCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            
            return (
              <Card key={column.id} className={cn('p-4', column.color)}>
                <div className="mb-4">
                  <h3 className="font-semibold flex items-center justify-between">
                    {column.title}
                    <span className="text-sm font-normal text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </h3>
                </div>

                <KanbanColumn columnId={column.id} tasks={columnTasks}>
                  <SortableContext
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No tasks
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <KanbanCard 
                          key={task.id} 
                          task={task}
                          onView={onTaskView}
                          onEdit={onTaskEdit}
                          onDuplicate={onTaskDuplicate}
                          onDelete={onTaskDelete}
                        />
                      ))
                    )}
                  </SortableContext>
                </KanbanColumn>
              </Card>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && <KanbanCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
