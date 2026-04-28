import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, startOfDay, isWithinInterval, differenceInDays, addDays } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BarChart3, LayoutGrid } from 'lucide-react';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NewEventModal } from '@/components/calendar/NewEventModal';
import { DealCard } from '@/components/calendar/DealCard';
import { TaskDetailPanel } from '@/components/calendar/TaskDetailPanel';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { GanttView } from '@/components/calendar/GanttView';
import type { CalendarTask } from '@/pages/Calendar';
import { getCategoryGroup } from '@/lib/calendarCategories';

interface ProjectCalendarProps {
  projectId: string;
  projectName: string;
  projectAddress: string;
}

function DraggableCard({ task, onClick }: { task: CalendarTask; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <DealCard task={task} compact onClick={onClick} />
    </div>
  );
}

function DroppableDay({
  day,
  isCurrentMonth,
  isExpanded,
  onClick,
  children,
}: {
  day: Date;
  isCurrentMonth: boolean;
  isExpanded: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        'min-h-[60px] sm:min-h-[100px] p-0.5 sm:p-2 rounded border transition-colors cursor-pointer',
        isCurrentMonth
          ? 'bg-card/50 border-border'
          : 'bg-background/50 border-border/50',
        isToday(day) && 'ring-1 ring-primary/50',
        isExpanded && 'ring-1 ring-primary/50',
        isOver && 'ring-2 ring-primary/50 bg-primary/5'
      )}
    >
      {children}
    </div>
  );
}

export function ProjectCalendar({ projectId, projectName, projectAddress }: ProjectCalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'gantt'>('calendar');
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateDate, setQuickCreateDate] = useState<Date | undefined>();
  const [activeTask, setActiveTask] = useState<CalendarTask | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const fetchEvents = async () => {
    const { data: eventsData, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('project_id', projectId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return;
    }

    const calendarTasks: CalendarTask[] = (eventsData || []).map((event: any) => ({
      id: event.id,
      projectId: event.project_id,
      projectName: projectName,
      title: event.title,
      startDate: parseDateString(event.start_date),
      endDate: parseDateString(event.end_date),
      status: getStatusFromCategory(event.event_category),
      budgetHealth: 'green' as const,
      category: event.event_category || 'due_diligence',
      checklist: Array.isArray(event.checklist) ? event.checklist : [],
      notes: event.notes || '',
      isCriticalPath: event.is_critical_path,
      eventCategory: event.event_category,
      leadTimeDays: event.lead_time_days,
      expectedDate: event.expected_date ? parseDateString(event.expected_date) : undefined,
      recurrenceGroupId: event.recurrence_group_id,
      isCompleted: event.is_completed || false,
      completedAt: event.completed_at,
      linkedTaskId: event.linked_task_id,
    }));

    setTasks(calendarTasks);
  };

  useEffect(() => {
    fetchEvents();
  }, [projectId]);

  const getStatusFromCategory = (category: string): CalendarTask['status'] => {
    const group = getCategoryGroup(category);
    switch (group) {
      case 'acquisition_admin': return 'permitting';
      case 'structural_exterior': return 'demo';
      case 'rough_ins': return 'rough-in';
      case 'inspections': return 'permitting';
      case 'interior_finishes': return 'finish';
      case 'milestones': return 'complete';
      default: return 'rough-in';
    }
  };

  const days = (() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  })();

  const getTasksForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    return tasks.filter(task => {
      const taskStart = startOfDay(task.startDate);
      const taskEnd = startOfDay(task.endDate);
      return isWithinInterval(dayStart, { start: taskStart, end: taskEnd });
    });
  };

  const handleTaskUpdate = async (updatedTask: CalendarTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleTaskDelete = (taskIds: string[]) => {
    setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
    setSelectedTask(null);
  };

  const handleDragStart = (event: any) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
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

    const { error } = await supabase
      .from('calendar_events')
      .update({
        start_date: targetDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
      })
      .eq('id', task.id);

    if (error) {
      console.error('Error moving event:', error);
      toast({ title: 'Error', description: 'Failed to move event', variant: 'destructive' });
      return;
    }

    setTasks(prev =>
      prev.map(t =>
        t.id === task.id ? { ...t, startDate: targetDate, endDate: newEndDate } : t
      )
    );

    toast({ title: 'Event Updated', description: `Moved "${task.title}" to new dates.` });
  };

  const goToPrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) goToNextMonth();
    else goToPrevMonth();
  };

  const weekDaysFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card className="bg-background border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* Left: title + info */}
          <div className="flex items-center gap-2 text-foreground font-semibold text-base sm:text-lg shrink-0">
            <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
            <span className="hidden sm:inline">Project Schedule</span>
          </div>

          {/* Center: month navigation */}
          <div className="flex items-center justify-center gap-1 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <MonthYearPicker
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              labelClassName="text-base font-semibold min-w-[150px] text-center"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Add button */}
          <div className="shrink-0">
            <NewEventModal
              projects={[{ id: projectId, name: projectName, address: projectAddress }]}
              onEventCreated={fetchEvents}
              defaultProjectId={projectId}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
            {weekDaysFull.map((day, i) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{weekDaysShort[i]}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid with swipe support */}
          <div
            className="grid grid-cols-7 gap-0.5 sm:gap-1"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {days.map(day => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayKey = day.toISOString();
              const isExpanded = expandedDay === dayKey;
              const visibleTasks = isExpanded ? dayTasks : dayTasks.slice(0, 3);
              const hasMore = dayTasks.length > 3;

              return (
                <DroppableDay
                  key={dayKey}
                  day={day}
                  isCurrentMonth={isCurrentMonth}
                  isExpanded={isExpanded}
                  onClick={() => {
                    setQuickCreateDate(day);
                    setTimeout(() => setQuickCreateOpen(true), 0);
                  }}
                >
                  <button
                     onClick={(e) => {
                       e.stopPropagation();
                       if (hasMore) setExpandedDay(isExpanded ? null : dayKey);
                     }}
                    className={cn(
                      'text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors',
                      isToday(day)
                        ? 'text-primary'
                        : isCurrentMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground/60',
                      hasMore && 'hover:bg-secondary cursor-pointer',
                      isExpanded && 'bg-primary/20 text-primary'
                    )}
                    title={hasMore ? (isExpanded ? 'Click to collapse' : `Click to see all ${dayTasks.length} events`) : undefined}
                  >
                    {format(day, 'd')}
                  </button>

                  {/* Mobile: "X tasks" badge → popover */}
                  <div className="sm:hidden">
                    {dayTasks.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-[9px] font-medium text-primary/80 hover:text-primary w-full text-center leading-tight mt-0.5 rounded hover:bg-primary/10 px-0.5 py-0.5 transition-colors">
                            {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0 overflow-hidden z-50" align="center">
                          <div className="px-3 py-2 border-b border-border bg-muted/30">
                            <p className="text-xs font-semibold">{format(day, 'EEEE, MMM d')}</p>
                            <p className="text-[10px] text-muted-foreground">{dayTasks.length} event{dayTasks.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="p-2 space-y-1.5 max-h-[240px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {dayTasks.map(task => (
                              <DealCard key={task.id} task={task} compact onClick={() => {
                                 setSelectedTask(task);
                                 setPanelOpen(true);
                               }} />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Desktop: existing colored DealCard layout (now draggable) */}
                  <div className="hidden sm:block space-y-0.5" onClick={(e) => e.stopPropagation()}>
                    {visibleTasks.map(task => (
                      <DraggableCard
                        key={task.id}
                        task={task}
                        onClick={() => {
                          setSelectedTask(task);
                          setPanelOpen(true);
                        }}
                      />
                    ))}
                    {hasMore && !isExpanded && (
                      <button
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExpandedDay(dayKey); }}
                        className="text-[10px] text-muted-foreground text-center w-full hover:text-foreground transition-colors"
                      >
                        +{dayTasks.length - 3}
                      </button>
                    )}
                  </div>
                </DroppableDay>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90 scale-105">
                <DealCard task={activeTask} compact />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="pt-3 mt-2 border-t border-border">
          <CalendarLegend />
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No events scheduled for this project
          </div>
        )}
      </CardContent>

      <NewEventModal
        projects={[{ id: projectId, name: projectName, address: projectAddress }]}
        onEventCreated={fetchEvents}
        defaultProjectId={projectId}
        externalOpen={quickCreateOpen}
        onExternalOpenChange={setQuickCreateOpen}
        defaultStartDate={quickCreateDate}
      />

      <TaskDetailPanel
        task={selectedTask}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        allTasks={tasks}
      />
    </Card>
  );
}
