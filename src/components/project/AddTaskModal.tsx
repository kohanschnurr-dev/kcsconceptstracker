import { useState, useRef, useCallback } from 'react';
import { useProjectOptions } from '@/hooks/useProjectOptions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X, Plus, Camera, Upload, Clipboard, ChevronDown, ListTodo, CalendarPlus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import type { TaskPriority, TaskStatus } from '@/types/task';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/types/task';
import { type Subtask, serializeDescription } from '@/lib/taskSubtasks';
import { NewEventModal } from '@/components/calendar/NewEventModal';

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onTaskCreated: () => void;
}

export function AddTaskModal({ open, onOpenChange, projectId, projectName, onTaskCreated }: AddTaskModalProps) {
  const { toast } = useToast();
  const allProjects = useProjectOptions();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarDefaults, setCalendarDefaults] = useState<{ title: string; startDate?: Date; projectId: string; linkedTaskId?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('pending');
    setDueDate('');
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

  const saveTask = async (): Promise<string | null> => {
    if (!title.trim() || isSubmitting) return null;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: 'You must be logged in', variant: 'destructive' }); return null; }

      const finalDescription = serializeDescription(description.trim(), subtasks);

      const { data, error } = await supabase.from('tasks').insert({
        user_id: user.id,
        project_id: projectId,
        title: title.trim(),
        description: finalDescription || null,
        priority_level: priority,
        status,
        due_date: dueDate || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : [],
        is_daily: false,
        is_scheduled: false,
      }).select('id').single();

      if (error) throw error;

      toast({ title: 'Task added', description: 'Your task has been created.' });
      onTaskCreated();
      return data?.id || null;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: 'Failed to create task', variant: 'destructive' });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    const taskId = await saveTask();
    if (taskId) handleClose();
  };

  const handleSaveAndCalendar = async () => {
    const savedTitle = title.trim();
    const savedDueDate = dueDate;
    const taskId = await saveTask();
    if (taskId) {
      setCalendarDefaults({
        title: savedTitle,
        startDate: savedDueDate ? new Date(savedDueDate + 'T00:00:00') : undefined,
        projectId,
        linkedTaskId: taskId,
      });
      resetForm();
      onOpenChange(false);
      setCalendarModalOpen(true);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const addSubtask = () => setSubtasks(prev => [...prev, { text: '', done: false }]);
  const removeSubtask = (index: number) => setSubtasks(prev => prev.filter((_, i) => i !== index));
  const updateSubtask = (index: number, value: string) => {
    setSubtasks(prev => prev.map((s, i) => i === index ? { ...s, text: value } : s));
  };
  const toggleSubtask = (index: number) => {
    setSubtasks(prev => prev.map((s, i) => i === index ? { ...s, done: !s.done } : s));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Task to {projectName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
            </div>

            {/* Description */}
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
                      <div key={index} className="relative group w-16 h-16 rounded-lg overflow-hidden border bg-muted cursor-pointer">
                        <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" onClick={() => setPreviewUrl(url)} />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPhotoUrls(prev => prev.filter((_, i) => i !== index)); }}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks */}
            <Collapsible defaultOpen={subtasks.length > 0}>
              <CollapsibleTrigger className="flex items-center gap-1.5 w-full group">
                <ListTodo className="h-4 w-4" />
                <span className="text-sm font-medium">Subtasks</span>
                {subtasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">{subtasks.length}</Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {subtasks.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox checked={s.done} onCheckedChange={() => toggleSubtask(i)} className="shrink-0" />
                    <Input
                      className={cn("flex-1", s.done && "line-through text-muted-foreground")}
                      value={s.text}
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
              </CollapsibleContent>
            </Collapsible>

            {/* Priority / Status */}
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

            {/* Due Date */}
            <div>
              <Label htmlFor="task-due">Due Date</Label>
              <Input id="task-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="flex items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveAndCalendar}
              disabled={!title.trim() || isSubmitting}
              className="gap-1.5 mr-auto"
            >
              <CalendarPlus className="h-4 w-4" />
              Save & Add to Calendar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={!title.trim() || isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          {previewUrl && <img src={previewUrl} alt="Preview" className="w-full rounded" />}
        </DialogContent>
      </Dialog>

      {/* Calendar Event Modal */}
      <NewEventModal
        projects={allProjects.map(p => ({ id: p.id, name: p.name, address: p.address || '' }))}
        onEventCreated={() => setCalendarModalOpen(false)}
        defaultProjectId={calendarDefaults?.projectId}
        defaultTitle={calendarDefaults?.title}
        defaultStartDate={calendarDefaults?.startDate}
        externalOpen={calendarModalOpen}
        onExternalOpenChange={setCalendarModalOpen}
      />
    </>
  );
}
