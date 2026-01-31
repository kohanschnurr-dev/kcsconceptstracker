import { useState, useEffect } from 'react';
import { Calendar, FileText, AlertTriangle } from 'lucide-react';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
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
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PasteableTextarea } from '@/components/PasteableTextarea';

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
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
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
      const { error } = await supabase
        .from('daily_logs')
        .insert({
          project_id: selectedProject,
          date,
          work_performed: workPerformed,
          issues: issues || null,
          photo_urls: photoUrls,
        });

      if (error) throw error;

      toast({
        title: 'Log created!',
        description: 'Daily log entry has been saved.',
      });

      // Reset form
      setSelectedProject('');
      setDate(new Date().toISOString().split('T')[0]);
      setWorkPerformed('');
      setIssues('');
      setPhotoUrls([]);
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
      <DialogContent className="sm:max-w-md bg-card border-border">
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
              <ProjectAutocomplete
                projects={projects}
                value={selectedProject}
                onSelect={setSelectedProject}
                placeholder="Search projects..."
              />
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
            <PasteableTextarea
              value={workPerformed}
              onChange={setWorkPerformed}
              placeholder="Describe the work completed today..."
              rows={3}
              bucketName="project-photos"
              folderPath="daily-logs"
              uploadedImages={photoUrls}
              onImagesChange={setPhotoUrls}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Issues Encountered
            </Label>
            <PasteableTextarea
              value={issues}
              onChange={setIssues}
              placeholder="Any problems or concerns? (optional)"
              rows={2}
              bucketName="project-photos"
              folderPath="daily-logs"
              uploadedImages={[]}
              onImagesChange={() => {}}
            />
          </div>

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
