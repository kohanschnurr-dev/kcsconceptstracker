import { useMemo, useState } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isToday,
  format,
  startOfDay,
  differenceInDays,
  addDays
} from 'date-fns';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DealCard } from './DealCard';
import type { CalendarTask } from '@/pages/Calendar';

interface WeeklyViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
}

function DraggableCard({ task, onTaskClick }: { task: CalendarTask; onTaskClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  
  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <DealCard task={task} onClick={onTaskClick} />
    </div>
  );
}

function DroppableDay({ day, children, onDoubleClick }: { day: Date; children: React.ReactNode; onDoubleClick?: () => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={onDoubleClick}
      className={cn(
        'min-h-[400px] p-3 rounded-lg border transition-colors',
        'bg-card/50 border-border',
        isToday(day) && 'ring-2 ring-primary/50',
        isOver && 'ring-2 ring-primary/50 bg-primary/5'
      )}
    >
      {children}
    </div>
  );
}

export function WeeklyView({ currentDate, tasks, onTaskClick, onTaskMove }: WeeklyViewProps) {
  const [activeTask, setActiveTask] = useState<CalendarTask | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      return date >= taskStart && date <= taskEnd;
    });
  };

  const handleDragStart = (event: any) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    const targetDate = new Date(over.id as string);
    const taskStartDay = startOfDay(task.startDate);
    if (targetDate.getTime() === taskStartDay.getTime()) return;

    const duration = differenceInDays(task.endDate, task.startDate);
    const newEndDate = addDays(targetDate, duration);
    onTaskMove(task.id, targetDate, newEndDate);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-3">
          {days.map(day => {
            const dayTasks = getTasksForDay(day);
            
            return (
              <DroppableDay key={day.toISOString()} day={day}>
                <div className="text-center mb-3 pb-2 border-b border-border">
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </p>
                  <p className={cn(
                    'text-2xl font-bold',
                    isToday(day) ? 'text-primary' : 'text-foreground'
                  )}>
                    {format(day, 'd')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <DraggableCard
                      key={task.id}
                      task={task}
                      onTaskClick={() => onTaskClick(task)}
                    />
                  ))}
                  {dayTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground/60 text-center py-4">
                      No tasks
                    </p>
                  )}
                </div>
              </DroppableDay>
            );
          })}
        </div>
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 scale-105">
            <DealCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
