import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Plus, Camera, Upload, Clipboard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TaskPriority, TaskStatus } from '@/types/task';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/types/task';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
import { Textarea } from '@/components/ui/textarea';
import { toast as sonnerToast } from 'sonner';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function AddTaskDialog({ open, onOpenChange, onTaskCreated }: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string; address?: string; status?: string; projectType?: string }[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    supabase.from('projects').select('id, name, address, status, project_type').then(({ data }) => {
      if (data) {
        setProjects(data.map(p => ({ id: p.id, name: p.name, address: p.address ?? undefined, status: p.status, projectType: p.project_type })));
      }
    });
  }, [open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('pending');
    setDueDate('');
    setProjectId('');
    setPhotoUrls([]);
    setSubtasks([]);
  };

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('task-photos').upload(fileName, file);
      if (uploadError) { sonnerToast.error('Failed to upload image'); return; }
      const { data } = supabase.storage.from('task-photos').getPublicUrl(fileName);
      setPhotoUrls(prev => [...prev, data.publicUrl]);
      sonnerToast.success('Image uploaded');
    } catch { sonnerToast.error('Failed to upload image'); }
    finally { setIsUploading(false); }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) { if (file.type.startsWith('image/')) await uploadFile(file); }
    e.target.value = '';
  }, [uploadFile]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    for (const file of Array.from(e.dataTransfer.files)) { if (file.type.startsWith('image/')) await uploadFile(file); }
  }, [uploadFile]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) { e.preventDefault(); const file = item.getAsFile(); if (file) await uploadFile(file); break; }
    }
  }, [uploadFile]);

  const handleSave = async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let finalDescription = description.trim();
      const validSubtasks = subtasks.filter(s => s.trim());
      if (validSubtasks.length > 0) {
        finalDescription += '\n---LINE_ITEMS---\n' + JSON.stringify(validSubtasks);
      }

      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: title.trim(),
        description: finalDescription || null,
        priority_level: priority,
        status,
        due_date: dueDate || null,
        project_id: projectId || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : [],
      });

      if (error) throw error;

      toast({ title: 'Task added', description: 'Your task has been created.' });
      resetForm();
      onOpenChange(false);
      onTaskCreated?.();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSubtask = () => setSubtasks(prev => [...prev, '']);
  const removeSubtask = (index: number) => setSubtasks(prev => prev.filter((_, i) => i !== index));
  const updateSubtask = (index: number, value: string) => {
    setSubtasks(prev => prev.map((s, i) => i === index ? value : s));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
          </div>

          <div>
            <Label>Project (optional)</Label>
            <ProjectAutocomplete
              projects={projects}
              value={projectId}
              onSelect={(id) => setProjectId(prev => prev === id ? '' : id)}
              placeholder="None"
            />
          </div>

          <div>
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
            />
          </div>

          {/* Photos */}
          <div>
            <Label>Photos</Label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
            <div
              className={`mt-1 border-2 border-dashed rounded-lg p-3 transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-primary/30 bg-primary/5'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
              onPaste={handlePaste}
            >
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} disabled={isUploading}>
                  <Camera className="h-4 w-4 mr-1.5" /> Take Photo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-1.5" /> Upload File
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2">
                <Clipboard className="h-3 w-3" />
                Paste images with Ctrl+V or drag & drop
              </p>
              {isUploading && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                </div>
              )}
              {photoUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative group w-16 h-16 rounded-lg overflow-hidden border bg-muted">
                      <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrls(prev => prev.filter((_, i) => i !== index))}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <Label>Subtasks (optional)</Label>
            <div className="space-y-2 mt-1">
              {subtasks.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    value={s}
                    onChange={e => updateSubtask(i, e.target.value)}
                    placeholder="Subtask..."
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeSubtask(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSubtask} className="w-full">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Subtask
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TASK_PRIORITY_LABELS) as [TaskPriority, string][]).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="task-due">Due Date</Label>
            <Input id="task-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
