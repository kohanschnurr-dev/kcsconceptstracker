import { useState, useEffect, useRef, useCallback } from 'react';
import { ListTodo, Check, Clock, AlertCircle, Plus, Calendar, Trash2, Camera, X, Loader2, FileText } from 'lucide-react';
import { parseDateString, formatDisplayDateShort } from '@/lib/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasteableTextarea } from '@/components/PasteableTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/types/task';
import type { TaskStatus, TaskPriority } from '@/types/task';
import { AddTaskModal } from './AddTaskModal';

const PRIORITY_ICON_COLORS: Record<TaskPriority, string> = {
  low: 'text-muted-foreground',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

function TaskPhotoUploader({ photos, onPhotosChange }: { photos: string[]; onPhotosChange: (urls: string[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `task-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('project-photos').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('project-photos').getPublicUrl(path);
      onPhotosChange([...photos, data.publicUrl]);
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setIsUploading(false);
    }
  }, [photos, onPhotosChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Camera className="h-4 w-4" />
        Photos (optional)
      </Label>
      <div className="flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border bg-muted">
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onPhotosChange(photos.filter((_, idx) => idx !== i))}
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priorityLevel: TaskPriority;
  dueDate: string | null;
  photoUrls: string[];
}

interface ProjectTasksProps {
  projectId: string;
  projectName: string;
}

export function ProjectTasks({ projectId, projectName }: ProjectTasksProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit dialog state
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('pending');
  const [editPhotoUrls, setEditPhotoUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, status, priority_level, due_date, photo_urls')
        .eq('project_id', projectId)
        .in('status', ['pending', 'in_progress'])
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setTasks((data || []).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description ?? null,
        status: t.status as TaskStatus,
        priorityLevel: t.priority_level as TaskPriority,
        dueDate: t.due_date,
        photoUrls: (t as any).photo_urls || [],
      })));
    } catch (error) {
      console.error('Error fetching project tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (task: ProjectTask) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditPriority(task.priorityLevel);
    setEditDueDate(task.dueDate ?? '');
    setEditStatus(task.status);
    setEditPhotoUrls(task.photoUrls || []);
  };

  const handleSaveEdit = async () => {
    if (!selectedTask) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editTitle,
          description: editDescription || null,
          priority_level: editPriority,
          due_date: editDueDate || null,
          status: editStatus,
          photo_urls: editPhotoUrls,
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast({ title: 'Task updated!' });
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', deleteTaskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== deleteTaskId));
      toast({ title: 'Task deleted.' });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    } finally {
      setDeleteTaskId(null);
      setSelectedTask(null);
    }
  };

  const handleToggleComplete = async (task: ProjectTask, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
      
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;

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

  const editFormContent = (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Task title"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={editPriority} onValueChange={(v) => setEditPriority(v as TaskPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={editStatus} onValueChange={(v) => setEditStatus(v as TaskStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-due-date">Due Date</Label>
        <Input
          id="edit-due-date"
          type="date"
          value={editDueDate}
          onChange={(e) => setEditDueDate(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          Notes & Photos
        </Label>
        <PasteableTextarea
          value={editDescription}
          onChange={setEditDescription}
          placeholder="Add notes about this task... (paste or drop images here)"
          rows={3}
          className="min-h-[80px] resize-none"
          bucketName="project-photos"
          folderPath="task-photos"
          uploadedImages={editPhotoUrls}
          onImagesChange={setEditPhotoUrls}
        />
      </div>
    </div>
  );

  const editFooterContent = (
    <div className="flex items-center justify-between w-full gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          if (selectedTask) setDeleteTaskId(selectedTask.id);
        }}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancel</Button>
        <Button onClick={handleSaveEdit} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
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
                  onClick={() => openEditDialog(task)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 hover:bg-muted/70 transition-colors cursor-pointer"
                >
                  <div onClick={(e) => handleToggleComplete(task, e)} className="shrink-0">
                    <Checkbox
                      checked={task.status === 'completed'}
                      className="shrink-0 pointer-events-none"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium line-clamp-1",
                      task.status === 'completed' && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                  </div>
                  <div className="hidden sm:flex w-[105px] shrink-0 items-center justify-end gap-1">
                    {task.dueDate && (
                      <>
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-foreground font-medium">Due {formatDisplayDateShort(task.dueDate)}</span>
                      </>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center justify-end gap-2 sm:w-[90px]">
                    <AlertCircle className={cn("h-4 w-4 sm:hidden", PRIORITY_ICON_COLORS[task.priorityLevel])} />
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs hidden sm:inline-flex", TASK_PRIORITY_COLORS[task.priorityLevel])}
                    >
                      {TASK_PRIORITY_LABELS[task.priorityLevel]}
                    </Badge>
                    <span className="hidden sm:block">{getStatusIcon(task.status)}</span>
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

      {/* Edit Task - Drawer on mobile, Dialog on desktop */}
      {isMobile ? (
        <Drawer open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTask(null); }}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Edit Task</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto flex-1">
              {editFormContent}
            </div>
            <DrawerFooter>
              {editFooterContent}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTask(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            {editFormContent}
            <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2">
              {editFooterContent}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => { if (!open) setDeleteTaskId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
