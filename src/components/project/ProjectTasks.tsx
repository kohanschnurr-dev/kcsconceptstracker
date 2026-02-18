import { useState, useEffect } from 'react';
import { ListTodo, Check, Clock, AlertCircle, Plus, Calendar } from 'lucide-react';
import { parseDateString, formatDisplayDateShort } from '@/lib/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/task';
import type { TaskStatus, TaskPriority } from '@/types/task';
import { AddTaskModal } from './AddTaskModal';

interface ProjectTask {
  id: string;
  title: string;
  status: TaskStatus;
  priorityLevel: TaskPriority;
  dueDate: string | null;
}

interface ProjectTasksProps {
  projectId: string;
  projectName: string;
}

export function ProjectTasks({ projectId, projectName }: ProjectTasksProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority_level, due_date')
        .eq('project_id', projectId)
        .in('status', ['pending', 'in_progress'])
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setTasks((data || []).map(t => ({
        id: t.id,
        title: t.title,
        status: t.status as TaskStatus,
        priorityLevel: t.priority_level as TaskPriority,
        dueDate: t.due_date,
      })));
    } catch (error) {
      console.error('Error fetching project tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: ProjectTask) => {
    try {
      const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
      
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;

      // Remove from list when completed
      if (newStatus === 'completed') {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        toast({ title: 'Task completed!' });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };


  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="h-3 w-3 text-success" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 text-blue-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Pipeline Tasks ({tasks.length})
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No tasks linked to this project yet. Click 'Add Task' to create one!
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
              >
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => handleToggleComplete(task)}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    task.status === 'completed' && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </p>
                </div>
                <div className="w-[105px] shrink-0 flex items-center justify-end gap-1">
                  {task.dueDate && (
                    <>
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-foreground font-medium">Due {formatDisplayDateShort(task.dueDate)}</span>
                    </>
                  )}
                </div>
                <div className="w-[90px] shrink-0 flex items-center justify-end gap-2">
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", TASK_PRIORITY_COLORS[task.priorityLevel])}
                  >
                    {TASK_PRIORITY_LABELS[task.priorityLevel]}
                  </Badge>
                  {getStatusIcon(task.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        projectId={projectId}
        projectName={projectName}
        onTaskCreated={fetchTasks}
      />
    </Card>
  );
}
