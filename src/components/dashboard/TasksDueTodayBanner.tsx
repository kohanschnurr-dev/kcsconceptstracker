import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { isToday, isPast, startOfDay, parseISO } from 'date-fns';
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
          const start = startOfDay(parseISO(e.start_date));
          const end = startOfDay(parseISO(e.end_date));
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
    <div className="glass-card border-warning/50 bg-warning/5 p-4 animate-slide-up">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-warning">Action Required</h3>
              <Badge 
                variant="secondary" 
                className="bg-warning/20 text-warning border-warning/30 text-xs"
              >
                {totalActionable} {totalActionable === 1 ? 'Item' : 'Items'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
              {todayEvents.length > 0 && (
                <span className="text-primary font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''} today
                </span>
              )}
              {tasksDueToday.length > 0 && (
                <span className="text-warning font-medium">
                  {tasksDueToday.length} task{tasksDueToday.length !== 1 ? 's' : ''} due
                </span>
              )}
              {overdueCount > 0 && (
                <span className="text-destructive font-medium">
                  {overdueCount} overdue
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Show today's calendar events as preview badges */}
          {todayEvents.length > 0 && todayEvents.length <= 3 && (
            <div className="hidden sm:flex items-center gap-2 mr-2">
              {todayEvents.slice(0, 3).map((event) => (
                <Badge 
                  key={event.id} 
                  variant="outline" 
                  className="text-xs max-w-[150px] truncate border-primary/30 text-primary"
                >
                  {event.title}
                </Badge>
              ))}
            </div>
          )}
          <Button
            onClick={() => navigate('/calendar')}
            variant="outline"
            size="sm"
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
          {(tasksDueToday.length > 0 || overdueCount > 0) && (
            <Button
              onClick={() => navigate('/checklist')}
              className="gap-2 bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              View Tasks
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
