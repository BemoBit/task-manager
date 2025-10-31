import { useDroppable } from '@dnd-kit/core';
import { Task } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  columnId: string;
  tasks: Task[];
  children: React.ReactNode;
}

export function KanbanColumn({ columnId, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'space-y-3 min-h-[200px] transition-colors',
        isOver && 'bg-accent/50 rounded-lg'
      )}
    >
      {children}
    </div>
  );
}
