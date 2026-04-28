import { useMemo, useState, useRef } from 'react';
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
  addDays,
  addMonths,
  subMonths,
} from 'date-fns';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DealCard } from './DealCard';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { CalendarTask } from '@/pages/Calendar';

interface MonthlyViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onDateChange?: (date: Date) => void;
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
      <DealCard task={task} compact onClick={onTaskClick} />
    </div>
  );
}

function DroppableDay({ 
  day, 
  children, 
  isCurrentMonth,
  onDoubleClick,
}: { 
  day: Date; 
  children: React.ReactNode; 
  isCurrentMonth: boolean;
  onDoubleClick?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={onDoubleClick}
      className={cn(
        'p-0.5 sm:p-2 rounded-lg border transition-colors',
        'min-h-[60px] sm:min-h-[140px]',
        isCurrentMonth 
          ? 'bg-card/50 border-border' 
          : 'bg-background/50 border-border/50',
        isToday(day) && 'ring-1 sm:ring-2 ring-primary/50',
        isOver && 'ring-2 ring-primary/50 bg-primary/5'
      )}
    >
      {children}
    </div>
  );
}

export function MonthlyView({ currentDate, tasks, onTaskClick, onTaskMove, onDateChange, onDayDoubleClick }: MonthlyViewProps) {
  const [activeTask, setActiveTask] = useState<CalendarTask | null>(null);
  const [openPopoverDay, setOpenPopoverDay] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !onDateChange) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      onDateChange(dx < 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
    touchStartX.current = null;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="flex flex-col h-full p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{weekDaysShort[i]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 flex-1">
          {days.map(day => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <DroppableDay key={day.toISOString()} day={day} isCurrentMonth={isCurrentMonth} onDoubleClick={() => onDayDoubleClick?.(day)}>
                <div className={cn(
                  'font-medium mb-0.5',
                  'text-[10px] sm:text-sm',
                  isToday(day) 
                    ? 'text-primary' 
                    : isCurrentMonth 
                      ? 'text-foreground' 
                      : 'text-muted-foreground/60'
                )}>
                  {format(day, 'd')}
                </div>
                
                {/* Mobile: compact badge → popover */}
                <div className="sm:hidden">
                  {dayTasks.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-[9px] font-medium text-primary/80 hover:text-primary w-full text-center rounded hover:bg-primary/10 px-0.5 py-0.5 leading-tight">
                          {dayTasks.length}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 overflow-hidden z-50" align="center">
                        <div className="px-3 py-2 border-b border-border bg-muted/30">
                          <p className="text-xs font-semibold text-foreground">
                            {format(day, 'EEEE, MMM d')}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {dayTasks.length} event{dayTasks.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="p-2 space-y-1.5 max-h-[240px] overflow-y-auto">
                          {dayTasks.map(task => (
                            <DealCard key={task.id} task={task} compact onClick={() => onTaskClick(task)} />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Desktop: full DealCard rendering */}
                <div className="hidden sm:block space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <DraggableCard
                      key={task.id}
                      task={task}
                      onTaskClick={() => onTaskClick(task)}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-[10px] text-primary cursor-pointer hover:underline w-full text-center">
                          +{dayTasks.length - 3} more
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 overflow-hidden" align="start">
                        <div className="px-3 py-2 border-b border-border bg-muted/30">
                          <p className="text-xs font-semibold text-foreground">
                            {format(day, 'EEEE, MMM d')}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {dayTasks.length} event{dayTasks.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="p-2 space-y-1.5 max-h-[240px] overflow-y-auto">
                          {dayTasks.map(task => (
                            <DealCard key={task.id} task={task} compact onClick={() => onTaskClick(task)} />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
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
