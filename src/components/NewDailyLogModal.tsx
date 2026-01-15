import { useState, useEffect } from 'react';
import { Calendar, FileText, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DailyLogTasksSection, TaskItem } from '@/components/dailylogs/DailyLogTasksSection';

interface Project {
  id: string;
  name: string;
}

interface NewDailyLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogCreated?: () => void;
}

export function NewDailyLogModal({ open, onOpenChange, onLogCreated }: NewDailyLogModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workPerformed, setWorkPerformed] = useState('');
  const [issues, setIssues] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .order('name');
    
    setProjects(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !workPerformed) {
      toast({
        title: 'Missing fields',
        description: 'Please select a project and describe work performed.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the daily log
      const { data: logData, error: logError } = await supabase
        .from('daily_logs')
        .insert({
          project_id: selectedProject,
          date,
          work_performed: workPerformed,
          issues: issues || null,
        })
        .select('id')
        .single();

      if (logError) throw logError;

      // Create tasks if any
      if (tasks.length > 0 && logData?.id) {
        const tasksToInsert = tasks.map((task) => ({
          daily_log_id: logData.id,
          description: task.description,
          is_complete: task.is_complete,
        }));

        const { error: tasksError } = await supabase
          .from('daily_log_tasks')
          .insert(tasksToInsert);

        if (tasksError) {
          console.error('Error creating tasks:', tasksError);
          // Don't throw - log was created successfully
        }
      }

      toast({
        title: 'Log created!',
        description: 'Daily log entry has been saved.',
      });

      // Reset form
      setSelectedProject('');
      setDate(new Date().toISOString().split('T')[0]);
      setWorkPerformed('');
      setIssues('');
      setTasks([]);
      onOpenChange(false);
      onLogCreated?.();
    } catch (error: any) {
      console.error('Error creating log:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create log.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            New Daily Log
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {projects.length === 0 && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning">
              No active projects found. Create a project first.
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Work Performed *
            </Label>
            <Textarea
              placeholder="Describe the work completed today..."
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Issues Encountered
            </Label>
            <Textarea
              placeholder="Any problems or concerns? (optional)"
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              rows={2}
            />
          </div>

          {/* Tasks Section */}
          <DailyLogTasksSection
            tasks={tasks}
            onTasksChange={setTasks}
            disabled={isSubmitting}
          />

          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isSubmitting || projects.length === 0}
            >
              {isSubmitting ? 'Saving...' : 'Save Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
