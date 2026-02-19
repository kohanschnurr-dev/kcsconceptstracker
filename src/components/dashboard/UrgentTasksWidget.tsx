import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskPriority } from '@/types/task';
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/task';
import { isPast, isToday } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface UrgentTasksWidgetProps {
  refreshKey?: number;
}

export function UrgentTasksWidget({ refreshKey }: UrgentTasksWidgetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUrgentTasks();
  }, [refreshKey]);

  // Realtime subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('urgent-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchUrgentTasks();
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
        fetchUrgentTasks();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchUrgentTasks = async () => {
    try {
      // Fetch pending and in_progress tasks, ordered by priority and due date
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('priority_level', { ascending: false })
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5);

      if (error) throw error;

      const transformed: Task[] = (data || []).map((t) => ({
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
        photoUrls: t.photo_urls || [],
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      setTasks(transformed);
    } catch (error) {
      console.error('Error fetching urgent tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    // Prevent double-clicks
    if (completingIds.has(task.id)) return;
    
    // Show checkmark animation
    setCompletingIds(prev => new Set(prev).add(task.id));
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: 'Task completed',
        description: `"${task.title}" marked as complete.`,
      });

      // Wait for animation, then remove from completing set
      setTimeout(() => {
        setCompletingIds(prev => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }, 600);
    } catch (error) {
      console.error('Error updating task:', error);
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const getPriorityOrder = (priority: TaskPriority): number => {
    const order: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return order[priority];
  };

  // Sort tasks: urgent/high priority first, then by overdue/due today
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityDiff = getPriorityOrder(a.priorityLevel) - getPriorityOrder(b.priorityLevel);
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by due date (overdue first)
    if (a.dueDate && b.dueDate) {
      return parseDateString(a.dueDate).getTime() - parseDateString(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Top Urgent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Top Urgent Tasks
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 h-7 px-2"
            onClick={() => navigate('/checklist')}
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-xs text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedTasks.map((task) => {
              const isCompleting = completingIds.has(task.id);

              return (
                <div
                  key={task.id}
                  onClick={() => handleToggleComplete(task)}
                  className={cn(
                    "flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-all cursor-pointer group",
                    isCompleting && "bg-green-500/20 scale-[0.98]"
                  )}
                >
                  <div className={cn(
                    "shrink-0 h-4 w-4 rounded border border-muted-foreground/50 flex items-center justify-center transition-all duration-200",
                    isCompleting && "bg-green-500 border-green-500 scale-110"
                  )}>
                    <Check className={cn(
                      "h-3 w-3 text-white transition-all duration-200",
                      isCompleting ? "opacity-100 scale-100" : "opacity-0 scale-0"
                    )} />
                  </div>
                  <p className={cn(
                    "flex-1 text-sm truncate min-w-0 transition-all duration-200",
                    isCompleting && "line-through text-muted-foreground"
                  )}>{task.title}</p>
                  <Badge variant="secondary" className={`shrink-0 text-[10px] px-1.5 py-0 h-5 ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}>
                    {TASK_PRIORITY_LABELS[task.priorityLevel]}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
