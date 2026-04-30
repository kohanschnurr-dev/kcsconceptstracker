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
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
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

interface DragData {
  task: CalendarTask;
  /** Day-offset within the event that the user grabbed. */
  grabOffset: number;
}

function DraggableCard({
  task,
  grabOffset,
  onTaskClick,
}: {
  task: CalendarTask;
  grabOffset: number;
  onTaskClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${task.id}::${grabOffset}`,
    data: { task, grabOffset } satisfies DragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <DealCard task={task} compact onClick={onTaskClick} />
    </div>
  );
}

function DroppableDay({
  day,
  children,
  isCurrentMonth,
  inRange,
  onDoubleClick,
}: {
  day: Date;
  children: React.ReactNode;
  isCurrentMonth: boolean;
  inRange: boolean;
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
        inRange && 'bg-primary/10 ring-1 ring-primary/40',
        isOver && 'ring-2 ring-primary/60 bg-primary/5',
      )}
    >
      {children}
    </div>
  );
}

export function MonthlyView({
  currentDate,
  tasks,
  onTaskClick,
  onTaskMove,
  onDateChange,
  onDayDoubleClick,
}: MonthlyViewProps) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [hoverDay, setHoverDay] = useState<Date | null>(null);
  const [openPopoverDay, setOpenPopoverDay] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
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

  // Range that the active drag would cover (for highlight)
  const previewRange = useMemo(() => {
    if (!activeDrag || !hoverDay) return null;
    const dur = differenceInDays(activeDrag.task.endDate, activeDrag.task.startDate);
    const newStart = addDays(startOfDay(hoverDay), -activeDrag.grabOffset);
    const newEnd = addDays(newStart, dur);
    return { start: newStart, end: newEnd };
  }, [activeDrag, hoverDay]);

  const isDayInPreview = (d: Date) => {
    if (!previewRange) return false;
    const day = startOfDay(d).getTime();
    return day >= previewRange.start.getTime() && day <= previewRange.end.getTime();
  };

  const handleDragStart = (event: any) => {
    setOpenPopoverDay(null);
    const data = event.active.data.current as DragData | undefined;
    if (data) setActiveDrag(data);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) return;
    const day = event.over.data.current?.date as Date | undefined;
    if (day) setHoverDay(day);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const data = activeDrag;
    setActiveDrag(null);
    setHoverDay(null);
    const { over } = event;
    if (!over || !data) return;

    const targetDate = startOfDay(new Date(over.id as string));
    const newStart = addDays(targetDate, -data.grabOffset);
    const dur = differenceInDays(data.task.endDate, data.task.startDate);
    const taskStartDay = startOfDay(data.task.startDate);
    if (newStart.getTime() === taskStartDay.getTime()) return; // no-op

    onTaskMove(data.task.id, newStart, addDays(newStart, dur));
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setActiveDrag(null); setHoverDay(null); }}
    >
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
              <DroppableDay
                key={day.toISOString()}
                day={day}
                isCurrentMonth={isCurrentMonth}
                inRange={isDayInPreview(day)}
                onDoubleClick={() => onDayDoubleClick?.(day)}
              >
                <div className={cn(
                  'font-medium mb-0.5',
                  'text-[10px] sm:text-sm',
                  isToday(day)
                    ? 'text-primary'
                    : isCurrentMonth
                      ? 'text-foreground'
                      : 'text-muted-foreground/60',
                )}>
                  {format(day, 'd')}
                </div>

                {/* Mobile: compact badge → popover */}
                <div className="sm:hidden">
                  {dayTasks.length > 0 && (
                    <Popover
                      open={openPopoverDay === `m-${day.toISOString()}`}
                      onOpenChange={(o) => setOpenPopoverDay(o ? `m-${day.toISOString()}` : null)}
                    >
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
                          {dayTasks.map(task => {
                            const offset = differenceInDays(startOfDay(day), startOfDay(task.startDate));
                            return (
                              <DraggableCard
                                key={task.id}
                                task={task}
                                grabOffset={offset}
                                onTaskClick={() => onTaskClick(task)}
                              />
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Desktop: full DealCard rendering */}
                <div className="hidden sm:block space-y-1">
                  {dayTasks.slice(0, 3).map(task => {
                    const offset = differenceInDays(startOfDay(day), startOfDay(task.startDate));
                    return (
                      <DraggableCard
                        key={task.id}
                        task={task}
                        grabOffset={offset}
                        onTaskClick={() => onTaskClick(task)}
                      />
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <Popover
                      open={openPopoverDay === `d-${day.toISOString()}`}
                      onOpenChange={(o) => setOpenPopoverDay(o ? `d-${day.toISOString()}` : null)}
                    >
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
                          {dayTasks.map(task => {
                            const offset = differenceInDays(startOfDay(day), startOfDay(task.startDate));
                            return (
                              <DraggableCard
                                key={task.id}
                                task={task}
                                grabOffset={offset}
                                onTaskClick={() => onTaskClick(task)}
                              />
                            );
                          })}
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

      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <div className="pointer-events-none scale-105 opacity-95">
            <DealCard task={activeDrag.task} compact />
            {previewRange && (
              <div className="mt-1 inline-block bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded shadow-md">
                {format(previewRange.start, 'MMM d')}
                {differenceInDays(previewRange.end, previewRange.start) > 0 &&
                  ` → ${format(previewRange.end, 'MMM d')}`}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
