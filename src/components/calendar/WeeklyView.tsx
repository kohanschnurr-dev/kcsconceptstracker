import { useMemo, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  format,
  startOfDay,
  differenceInDays,
  addDays,
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
import { EventBar } from './EventBar';
import { computeWeekLaneLayout } from '@/lib/calendarLaneLayout';
import type { CalendarTask } from '@/pages/Calendar';

interface WeeklyViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onDayDoubleClick?: (date: Date) => void;
}

const LANE_HEIGHT = 24;
const LANE_GAP = 3;
const HEADER_RESERVE = 60; // weekday + date number column header

interface DragData {
  task: CalendarTask;
  grabOffset: number;
}

function DraggableBar({
  task, grabOffset, children,
}: { task: CalendarTask; grabOffset: number; children: React.ReactNode }) {
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
  day, inRange, onDoubleClick, children,
}: { day: Date; inRange: boolean; onDoubleClick?: () => void; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });
  return (
    <div
      ref={setNodeRef}
      onDoubleClick={onDoubleClick}
      className={cn(
        'min-h-[400px] rounded-lg border transition-colors',
        'bg-card/50 border-border',
        isToday(day) && 'ring-2 ring-primary/40',
        inRange && 'bg-primary/10 ring-1 ring-primary/40',
        isOver && 'ring-2 ring-primary/60',
      )}
    >
      {children}
    </div>
  );
}

export function WeeklyView({
  currentDate, tasks, onTaskClick, onTaskMove, onDayDoubleClick,
}: WeeklyViewProps) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [hoverDay, setHoverDay] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const days = useMemo(() => {
    const wStart = startOfWeek(currentDate);
    const wEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: wStart, end: wEnd });
  }, [currentDate]);

  const layout = useMemo(() => {
    const items = tasks.map((t) => ({
      event: t, startDate: t.startDate, endDate: t.endDate,
    }));
    return computeWeekLaneLayout(items, days[0], days[6], 12); // weekly: show plenty of lanes
  }, [tasks, days]);

  const previewRange = useMemo(() => {
    if (!activeDrag || !hoverDay) return null;
    const dur = differenceInDays(activeDrag.task.endDate, activeDrag.task.startDate);
    const newStart = addDays(startOfDay(hoverDay), -activeDrag.grabOffset);
    return { start: newStart, end: addDays(newStart, dur) };
  }, [activeDrag, hoverDay]);

  const isDayInPreview = (d: Date) => {
    if (!previewRange) return false;
    const day = startOfDay(d).getTime();
    return day >= previewRange.start.getTime() && day <= previewRange.end.getTime();
  };

  const handleDragStart = (event: any) => {
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
    if (!event.over || !data) return;
    const target = startOfDay(new Date(event.over.id as string));
    const newStart = addDays(target, -data.grabOffset);
    const dur = differenceInDays(data.task.endDate, data.task.startDate);
    const taskStartDay = startOfDay(data.task.startDate);
    if (newStart.getTime() === taskStartDay.getTime()) return;
    onTaskMove(data.task.id, newStart, addDays(newStart, dur));
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setActiveDrag(null); setHoverDay(null); }}
    >
      <div className="p-4">
        <div className="relative grid grid-cols-7 gap-3">
          {days.map((day) => (
            <DroppableDay
              key={day.toISOString()}
              day={day}
              inRange={isDayInPreview(day)}
              onDoubleClick={() => onDayDoubleClick?.(day)}
            >
              <div className="text-center pt-2 pb-2 border-b border-border mx-3">
                <p className="text-xs text-muted-foreground uppercase">
                  {format(day, 'EEE')}
                </p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    isToday(day) ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {format(day, 'd')}
                </p>
              </div>
            </DroppableDay>
          ))}

          {/* Spanning bars layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ top: HEADER_RESERVE }}
          >
            {layout.placed.map((bar) => {
              const widthCols = bar.endCol - bar.startCol + 1;
              const leftPct = (bar.startCol / 7) * 100;
              const widthPct = (widthCols / 7) * 100;
              const top = bar.lane * (LANE_HEIGHT + LANE_GAP);
              const barTrueStart = startOfDay(bar.event.startDate);
              const offsetFromTrueStart = differenceInDays(
                addDays(startOfDay(days[0]), bar.startCol),
                barTrueStart,
              );
              return (
                <div
                  key={bar.event.id}
                  className="absolute pointer-events-auto px-3"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    top,
                    height: LANE_HEIGHT,
                  }}
                >
                  <DraggableBar task={bar.event} grabOffset={offsetFromTrueStart}>
                    <EventBar
                      task={bar.event}
                      continuesLeft={bar.continuesLeft}
                      continuesRight={bar.continuesRight}
                      onClick={() => onTaskClick(bar.event)}
                      height={LANE_HEIGHT}
                    />
                  </DraggableBar>
                </div>
              );
            })}
          </div>
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
