import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, ArrowRight, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { isToday, isPast, startOfDay } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
import type { Task } from '@/types/task';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface TasksDueTodayBannerProps {
  refreshKey?: number;
  onTasksLoaded?: (count: number) => void;
}

export function TasksDueTodayBanner({ refreshKey, onTasksLoaded }: TasksDueTodayBannerProps) {
  const navigate = useNavigate();
  const [tasksDueToday, setTasksDueToday] = useState<Task[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Realtime subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('tasks-due-today-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Refetch when tab becomes visible (cross-tab sync fallback)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .not('due_date', 'is', null);

      if (tasksError) throw tasksError;

      const transformed: Task[] = (tasksData || []).map((t) => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        description: t.description,
        dueDate: t.due_date,
        status: t.status as Task['status'],
        priorityLevel: t.priority_level as Task['priorityLevel'],
        dailyLogId: t.daily_log_id,
        isDaily: t.is_daily,
        scheduledDate: t.scheduled_date,
        isScheduled: t.is_scheduled,
        startTime: t.start_time,
        endTime: t.end_time,
        projectId: t.project_id,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      // Filter tasks due today
      const dueToday = transformed.filter(
        (t) => t.dueDate && isToday(new Date(t.dueDate))
      );

      // Count overdue tasks (past due date, not completed)
      const overdue = transformed.filter(
        (t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
      );

      setTasksDueToday(dueToday);
      setOverdueCount(overdue.length);

      // Fetch calendar events for today
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*');

      if (eventsError) throw eventsError;

      const today = startOfDay(new Date());
      const todaysCalendarEvents: CalendarEvent[] = (eventsData || [])
        .filter((e) => {
          const start = startOfDay(parseDateString(e.start_date));
          const end = startOfDay(parseDateString(e.end_date));
          return today >= start && today <= end;
        })
        .map((e) => ({
          id: e.id,
          title: e.title,
          startDate: e.start_date,
          endDate: e.end_date,
        }));

      setTodayEvents(todaysCalendarEvents);
      onTasksLoaded?.(dueToday.length + overdue.length + todaysCalendarEvents.length);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return null;

  const totalActionable = tasksDueToday.length + overdueCount + todayEvents.length;

  if (totalActionable === 0) return null;

  return (
    <div className="glass-card border-border bg-muted/30 p-4 animate-slide-up">
      {/* Header Row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ListChecks className="h-5 w-5 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Today's Agenda</h3>
          <Badge variant="secondary" className="text-xs">
            {totalActionable} {totalActionable === 1 ? 'Item' : 'Items'}
          </Badge>
        </div>
      </div>

      {/* Three-Box Grid: equal columns */}
      <div className="grid grid-cols-3 gap-3">
        {/* Left Box - View Calendar */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border/30 flex flex-col items-center justify-between min-h-[120px]">
          <Calendar className="h-8 w-8 text-primary mb-2" />
          <div className="mt-auto w-full">
            <Button
              onClick={() => navigate('/calendar')}
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 w-full"
            >
              View Calendar
            </Button>
          </div>
        </div>

        {/* Middle Box - Tasks */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border/30 flex flex-col items-center justify-between text-center min-h-[120px]">
          <Clock className="h-8 w-8 text-primary mb-2" />
          <div className="space-y-1">
            {tasksDueToday.length > 0 && (
              <p className="text-sm text-warning font-medium">
                {tasksDueToday.length} due today
              </p>
            )}
            {overdueCount > 0 && (
              <p className="text-sm text-destructive font-medium">
                {overdueCount} overdue
              </p>
            )}
            {tasksDueToday.length === 0 && overdueCount === 0 && (
              <p className="text-sm text-muted-foreground">No tasks due</p>
            )}
          </div>
          <div className="mt-auto w-full">
            <Button
              onClick={() => navigate('/checklist')}
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 w-full"
            >
              View Tasks
            </Button>
          </div>
        </div>

        {/* Right Box - Events */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border/30 flex flex-col items-center justify-between text-center min-h-[120px]">
          <Calendar className="h-8 w-8 text-primary mb-2" />
          <div className="mt-auto">
            {todayEvents.length > 0 ? (
              <div className="space-y-1">
                {todayEvents.slice(0, 3).map((event) => (
                  <p key={event.id} className="text-sm text-foreground truncate max-w-full">
                    {event.title}
                  </p>
                ))}
                {todayEvents.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{todayEvents.length - 3} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No events today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
