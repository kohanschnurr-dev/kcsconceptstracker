import { useState, useEffect } from 'react';
import { CheckSquare, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingTask {
  id: string;
  description: string;
  is_complete: boolean;
  daily_log_id: string;
  log_date: string;
  project_name: string;
}

interface PendingTasksWidgetProps {
  onNavigateToLog?: (logId: string) => void;
  refreshTrigger?: number;
}

export function PendingTasksWidget({ onNavigateToLog, refreshTrigger }: PendingTasksWidgetProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingTasks();
  }, [refreshTrigger]);

  const fetchPendingTasks = async () => {
    try {
      // Fetch incomplete tasks with their log and project info
      const { data, error } = await supabase
        .from('daily_log_tasks')
        .select(`
          id,
          description,
          is_complete,
          daily_log_id,
          daily_logs!inner (
            date,
            projects!inner (
              name
            )
          )
        `)
        .eq('is_complete', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedTasks: PendingTask[] = (data || []).map((task: any) => ({
        id: task.id,
        description: task.description,
        is_complete: task.is_complete,
        daily_log_id: task.daily_log_id,
        log_date: task.daily_logs.date,
        project_name: task.daily_logs.projects.name,
      }));

      // Sort by log date descending
      formattedTasks.sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
      
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('daily_log_tasks')
        .update({ is_complete: true })
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({
        title: 'Task completed!',
        description: 'Task marked as complete.',
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Pending Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-4 w-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          Pending Tasks
          {tasks.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {tasks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            All tasks complete!
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <Checkbox
                  checked={task.is_complete}
                  onCheckedChange={() => toggleTaskComplete(task.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {task.project_name}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(task.log_date)}
                    </span>
                  </div>
                </div>
                {onNavigateToLog && (
                  <button
                    onClick={() => onNavigateToLog(task.daily_log_id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded"
                    title="Go to log"
                  >
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
