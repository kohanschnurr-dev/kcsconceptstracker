import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { NewEventModal } from '@/components/calendar/NewEventModal';
import { DealCard } from '@/components/calendar/DealCard';
import { TaskDetailPanel } from '@/components/calendar/TaskDetailPanel';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import type { CalendarTask } from '@/pages/Calendar';
import { getCategoryGroup } from '@/lib/calendarCategories';

interface ProjectCalendarProps {
  projectId: string;
  projectName: string;
  projectAddress: string;
}

export function ProjectCalendar({ projectId, projectName, projectAddress }: ProjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

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
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
      status: getStatusFromCategory(event.event_category),
      budgetHealth: 'green' as const,
      category: event.event_category || 'due_diligence',
      checklist: Array.isArray(event.checklist) ? event.checklist : [],
      notes: event.notes || '',
      isCriticalPath: event.is_critical_path,
      eventCategory: event.event_category,
      leadTimeDays: event.lead_time_days,
      expectedDate: event.expected_date ? new Date(event.expected_date) : undefined,
    }));

    setTasks(calendarTasks);
  };

  useEffect(() => {
    fetchEvents();
  }, [projectId]);

  const getStatusFromCategory = (category: string): CalendarTask['status'] => {
    const group = getCategoryGroup(category);
    switch (group) {
      case 'acquisition_admin':
        return 'permitting';
      case 'structural_exterior':
        return 'demo';
      case 'rough_ins':
        return 'rough-in';
      case 'inspections':
        return 'permitting';
      case 'interior_finishes':
        return 'finish';
      case 'milestones':
        return 'complete';
      default:
        return 'rough-in';
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
    return tasks.filter(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      return date >= taskStart && date <= taskEnd;
    });
  };

  const handleTaskUpdate = async (updatedTask: CalendarTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <CalendarIcon className="h-5 w-5 text-emerald-500" />
            Project Schedule
          </CardTitle>
          <NewEventModal
            projects={[{ id: projectId, name: projectName, address: projectAddress }]}
            onEventCreated={fetchEvents}
            defaultProjectId={projectId}
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-white min-w-[120px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <CalendarLegend />
      </CardHeader>
      <CardContent>
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[60px] p-1 rounded border transition-colors',
                  isCurrentMonth 
                    ? 'bg-slate-800/50 border-slate-700' 
                    : 'bg-slate-900/50 border-slate-800',
                  isToday(day) && 'ring-1 ring-emerald-500/50'
                )}
              >
                <div className={cn(
                  'text-xs font-medium mb-1',
                  isToday(day) 
                    ? 'text-emerald-400' 
                    : isCurrentMonth 
                      ? 'text-white' 
                      : 'text-slate-600'
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map(task => (
                    <DealCard
                      key={task.id}
                      task={task}
                      compact
                      onClick={() => {
                        setSelectedTask(task);
                        setPanelOpen(true);
                      }}
                    />
                  ))}
                  {dayTasks.length > 2 && (
                    <p className="text-[10px] text-slate-500 text-center">
                      +{dayTasks.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-sm">
            No events scheduled for this project
          </div>
        )}
      </CardContent>

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