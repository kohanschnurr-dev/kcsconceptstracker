import { useMemo, useState } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  startOfDay,
  isWithinInterval,
  differenceInDays,
  addDays
} from 'date-fns';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DealCard } from './DealCard';
import type { CalendarTask } from '@/pages/Calendar';

interface MonthlyViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
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
      <DealCard task={task} compact onClick={onTaskClick} />
    </div>
  );
}

function DroppableDay({ 
  day, 
  children, 
  isCurrentMonth 
}: { 
  day: Date; 
  children: React.ReactNode; 
  isCurrentMonth: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[140px] p-2 rounded-lg border transition-colors',
        isCurrentMonth 
          ? 'bg-card/50 border-border' 
          : 'bg-background/50 border-border/50',
        isToday(day) && 'ring-2 ring-primary/50',
        isOver && 'ring-2 ring-primary/50 bg-primary/5'
      )}
    >
      {children}
    </div>
  );
}

export function MonthlyView({ currentDate, tasks, onTaskClick, onTaskMove }: MonthlyViewProps) {
  const [activeTask, setActiveTask] = useState<CalendarTask | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getTasksForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    return tasks.filter(task => {
      const taskStart = startOfDay(task.startDate);
      const taskEnd = startOfDay(task.endDate);
      return isWithinInterval(dayStart, { start: taskStart, end: taskEnd });
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 flex-1">
          {days.map(day => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <DroppableDay key={day.toISOString()} day={day} isCurrentMonth={isCurrentMonth}>
                <div className={cn(
                  'text-sm font-medium mb-1',
                  isToday(day) 
                    ? 'text-primary' 
                    : isCurrentMonth 
                      ? 'text-foreground' 
                      : 'text-muted-foreground/60'
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <DraggableCard
                      key={task.id}
                      task={task}
                      onTaskClick={() => onTaskClick(task)}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      +{dayTasks.length - 3} more
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
            <DealCard task={activeTask} compact />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
