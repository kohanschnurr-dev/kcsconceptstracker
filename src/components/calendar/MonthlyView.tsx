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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DealCard } from './DealCard';
import { EventBar } from './EventBar';
import { computeWeekLaneLayout, eventOverlapsDay } from '@/lib/calendarLaneLayout';
import type { CalendarTask } from '@/pages/Calendar';

interface MonthlyViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onDateChange?: (date: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
}

const MAX_LANES = 3;
const LANE_HEIGHT = 22;
const LANE_GAP = 2;
const HEADER_RESERVE = 22; // space at top of cell for date number

interface DragData {
  task: CalendarTask;
  /** Day-offset within the bar that the user grabbed. */
  grabOffset: number;
}

function DraggableBar({
  task,
  grabOffset,
  children,
}: {
  task: CalendarTask;
  grabOffset: number;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task, grabOffset } satisfies DragData,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0 : 1 }}
      className="w-full"
    >
      {children}
    </div>
  );
}

function DroppableDay({
  day,
  inRange,
  isCurrentMonth,
  onDoubleClick,
  children,
}: {
  day: Date;
  inRange: boolean;
  isCurrentMonth: boolean;
  onDoubleClick?: () => void;
  children: React.ReactNode;
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
        'relative border transition-colors',
        'min-h-[120px] sm:min-h-[150px]',
        isCurrentMonth ? 'bg-card/40 border-border' : 'bg-background/60 border-border/50',
        isToday(day) && 'ring-1 ring-primary/40',
        inRange && 'bg-primary/10 ring-1 ring-primary/40',
        isOver && 'ring-2 ring-primary/60',
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
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    });
  }, [currentDate]);

  // Group days into weeks of 7
  const weeks = useMemo(() => {
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  // Pre-compute lane layout per week
  const weekLayouts = useMemo(() => {
    return weeks.map((week) => {
      const weekStart = week[0];
      const weekEnd = week[6];
      const laneItems = tasks.map((t) => ({
        event: t,
        startDate: t.startDate,
        endDate: t.endDate,
      }));
      return computeWeekLaneLayout(laneItems, weekStart, weekEnd, MAX_LANES);
    });
  }, [weeks, tasks]);

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
        <div className="grid grid-cols-7 gap-px mb-1">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{weekDaysShort[i]}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-px">
          {weeks.map((week, wIdx) => {
            const layout = weekLayouts[wIdx];
            return (
              <div key={wIdx} className="relative grid grid-cols-7 gap-px">
                {/* Day cells */}
                {week.map((day) => {
                  const inRange = isDayInPreview(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  // Mobile fallback: render compact list of events overlapping this day
                  const dayEvents = tasks.filter((t) => eventOverlapsDay(t, day));

                  return (
                    <DroppableDay
                      key={day.toISOString()}
                      day={day}
                      inRange={inRange}
                      isCurrentMonth={isCurrentMonth}
                      onDoubleClick={() => onDayDoubleClick?.(day)}
                    >
                      <div
                        className={cn(
                          'px-1.5 pt-1 text-[10px] sm:text-xs font-medium',
                          isToday(day)
                            ? 'text-primary'
                            : isCurrentMonth
                              ? 'text-foreground'
                              : 'text-muted-foreground/50',
                        )}
                      >
                        {format(day, 'd')}
                      </div>

                      {/* Mobile fallback */}
                      <div className="sm:hidden px-1 pb-1">
                        {dayEvents.length > 0 && (
                          <Popover
                            open={openPopoverDay === `m-${day.toISOString()}`}
                            onOpenChange={(o) =>
                              setOpenPopoverDay(o ? `m-${day.toISOString()}` : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <button className="text-[9px] font-medium text-primary/80 hover:text-primary w-full text-center rounded hover:bg-primary/10 px-0.5 py-0.5 leading-tight">
                                {dayEvents.length}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-72 p-0 overflow-hidden z-50"
                              align="center"
                            >
                              <div className="px-3 py-2 border-b border-border bg-muted/30">
                                <p className="text-xs font-semibold">
                                  {format(day, 'EEEE, MMM d')}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {dayEvents.length} event
                                  {dayEvents.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="p-2 space-y-1.5 max-h-[240px] overflow-y-auto">
                                {dayEvents.map((task) => (
                                  <DealCard
                                    key={task.id}
                                    task={task}
                                    compact
                                    onClick={() => onTaskClick(task)}
                                  />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </DroppableDay>
                  );
                })}

                {/* Spanning bars layer (desktop) */}
                <div
                  className="hidden sm:block absolute inset-0 pointer-events-none"
                  style={{ top: HEADER_RESERVE }}
                >
                  {layout.placed.map((bar) => {
                    const widthCols = bar.endCol - bar.startCol + 1;
                    const leftPct = (bar.startCol / 7) * 100;
                    const widthPct = (widthCols / 7) * 100;
                    const top = bar.lane * (LANE_HEIGHT + LANE_GAP);
                    // Grab offset: cursor lands on a column within this bar.
                    // Use the bar's start column relative to its true start day.
                    const barTrueStart = startOfDay(bar.event.startDate);
                    const weekStart = startOfDay(week[0]);
                    const offsetFromTrueStart = differenceInDays(
                      addDays(weekStart, bar.startCol),
                      barTrueStart,
                    );
                    return (
                      <div
                        key={bar.event.id + '-' + wIdx}
                        className="absolute pointer-events-auto px-0.5"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top,
                          height: LANE_HEIGHT,
                        }}
                      >
                        <DraggableBar
                          task={bar.event}
                          // The user grabs roughly the middle of the visible
                          // segment; offset from the event's true start.
                          grabOffset={offsetFromTrueStart}
                        >
                          <EventBar
                            task={bar.event}
                            continuesLeft={bar.continuesLeft}
                            continuesRight={bar.continuesRight}
                            onClick={() => onTaskClick(bar.event)}
                          />
                        </DraggableBar>
                      </div>
                    );
                  })}

                  {/* +N more pills per column */}
                  {layout.overflowByCol.map((items, col) => {
                    if (items.length === 0) return null;
                    const leftPct = (col / 7) * 100;
                    const widthPct = (1 / 7) * 100;
                    const top = MAX_LANES * (LANE_HEIGHT + LANE_GAP);
                    const day = week[col];
                    return (
                      <div
                        key={`more-${wIdx}-${col}`}
                        className="absolute pointer-events-auto px-0.5"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top,
                        }}
                      >
                        <Popover
                          open={openPopoverDay === `more-${day.toISOString()}`}
                          onOpenChange={(o) =>
                            setOpenPopoverDay(o ? `more-${day.toISOString()}` : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button className="w-full text-[10px] text-primary hover:underline text-center px-1 py-0.5">
                              +{items.length} more
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-72 p-0 overflow-hidden"
                            align="start"
                          >
                            <div className="px-3 py-2 border-b border-border bg-muted/30">
                              <p className="text-xs font-semibold">
                                {format(day, 'EEEE, MMM d')}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {items.length} more event
                                {items.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="p-2 space-y-1.5 max-h-[240px] overflow-y-auto">
                              {items.map((task) => (
                                <DealCard
                                  key={task.id}
                                  task={task}
                                  compact
                                  onClick={() => onTaskClick(task)}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <div className="pointer-events-none">
            <div className="rounded-md border border-primary bg-card shadow-2xl px-2 py-1.5 text-xs font-medium text-foreground min-w-[160px]">
              <div className="truncate">{activeDrag.task.title}</div>
              {previewRange && (
                <div className="text-[10px] text-primary mt-0.5">
                  {format(previewRange.start, 'MMM d')} → {format(previewRange.end, 'MMM d')}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
