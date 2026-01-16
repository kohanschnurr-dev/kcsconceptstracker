import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskPriority } from '@/types/task';
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/task';
import { format, isPast, isToday } from 'date-fns';

interface UrgentTasksWidgetProps {
  refreshKey?: number;
}

export function UrgentTasksWidget({ refreshKey }: UrgentTasksWidgetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUrgentTasks();
  }, [refreshKey]);

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

      fetchUrgentTasks();
    } catch (error) {
      console.error('Error updating task:', error);
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
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Top Urgent Tasks
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => navigate('/checklist')}
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedTasks.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task) => {
              const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
              const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleToggleComplete(task)}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className={`h-3 w-3 ${isOverdue ? 'text-red-500' : isDueToday ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : isDueToday ? 'text-orange-500' : 'text-muted-foreground'}`}>
                          {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today' : ''} 
                          {!isDueToday && format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className={`shrink-0 text-xs ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}>
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
