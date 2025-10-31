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
    const newStatus = over.id as Task['status'];

    // Update task status if dropped in a different column
    if (columns.some((col) => col.id === newStatus)) {
      onTaskUpdate(taskId, { status: newStatus });
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

                <SortableContext
                  id={column.id}
                  items={columnTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <KanbanColumn columnId={column.id} tasks={columnTasks}>
                    {columnTasks.map((task) => (
                      <KanbanCard key={task.id} task={task} />
                    ))}
                  </KanbanColumn>
                </SortableContext>

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tasks
                  </div>
                )}
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
