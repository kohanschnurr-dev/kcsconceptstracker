import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TaskPriority, TaskStatus } from '@/types/task';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/types/task';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
import { PasteableTextarea } from '@/components/PasteableTextarea';

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
  const [lineItems, setLineItems] = useState<{ text: string; amount: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setLineItems([]);
  };

  const handleSave = async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let finalDescription = description.trim();
      if (lineItems.length > 0) {
        const validItems = lineItems.filter(li => li.text.trim());
        if (validItems.length > 0) {
          finalDescription += '\n---LINE_ITEMS---\n' + JSON.stringify(validItems);
        }
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

  const addLineItem = () => setLineItems(prev => [...prev, { text: '', amount: '' }]);
  const removeLineItem = (index: number) => setLineItems(prev => prev.filter((_, i) => i !== index));
  const updateLineItem = (index: number, field: 'text' | 'amount', value: string) => {
    setLineItems(prev => prev.map((li, i) => i === index ? { ...li, [field]: value } : li));
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
            <Label htmlFor="task-desc">Description & Photos</Label>
            <PasteableTextarea
              value={description}
              onChange={setDescription}
              placeholder="Add details... paste or drag images here"
              rows={3}
              bucketName="task-photos"
              uploadedImages={photoUrls}
              onImagesChange={setPhotoUrls}
            />
          </div>

          {/* Line Items */}
          <div>
            <Label>Line Items (optional)</Label>
            <div className="space-y-2 mt-1">
              {lineItems.map((li, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    value={li.text}
                    onChange={e => updateLineItem(i, 'text', e.target.value)}
                    placeholder="Item description"
                  />
                  <div className="relative w-24">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      className="pl-6"
                      type="number"
                      value={li.amount}
                      onChange={e => updateLineItem(i, 'amount', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeLineItem(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="w-full">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Line Item
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
