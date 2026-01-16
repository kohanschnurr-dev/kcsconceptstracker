import { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Inbox, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/task';

interface DraggableTaskProps {
  task: Task;
  onDelete: (id: string) => void;
  onClick: () => void;
}

function DraggableTask({ task, onDelete, onClick }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `leisure-${task.id}`,
    data: { task, source: 'leisure' },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'glass-card p-3 flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all',
        isDragging && 'opacity-50 shadow-lg scale-105',
        task.status === 'completed' && 'opacity-50'
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0" onClick={onClick}>
        <p className={cn(
          'text-sm font-medium truncate',
          task.status === 'completed' && 'line-through'
        )}>
          {task.title}
        </p>
        <Badge
          variant="secondary"
          className={cn('text-xs mt-1', TASK_PRIORITY_COLORS[task.priorityLevel])}
        >
          {TASK_PRIORITY_LABELS[task.priorityLevel]}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface LeisureBacklogProps {
  tasks: Task[];
  onAddTask: (title: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
  isCreating: boolean;
}

export function LeisureBacklog({
  tasks,
  onAddTask,
  onDeleteTask,
  onTaskClick,
  isCreating,
}: LeisureBacklogProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'leisure-backlog',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isCreating) return;
    await onAddTask(newTaskTitle.trim());
    setNewTaskTitle('');
  };

  // Filter to unscheduled tasks only
  const unscheduledTasks = tasks.filter((t) => !t.isScheduled && t.status !== 'completed');

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "h-full flex flex-col bg-muted/30 transition-colors",
        isOver && "bg-primary/10"
      )}
    >
      {/* Header with sticky quick add */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Leisure Backlog</h2>
          <Badge variant="secondary" className="ml-auto">
            {unscheduledTasks.length}
          </Badge>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Quick add task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="h-9 text-sm"
            disabled={isCreating}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newTaskTitle.trim() || isCreating}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {unscheduledTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No unscheduled tasks</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add tasks above or drag from calendar
            </p>
          </div>
        ) : (
          unscheduledTasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onClick={() => onTaskClick(task)}
            />
          ))
        )}
      </div>

      {/* Hint */}
      <div className="p-3 border-t border-border bg-card/50">
        <p className="text-xs text-muted-foreground text-center">
          💡 Drag tasks to the calendar to schedule them
        </p>
      </div>
    </div>
  );
}
