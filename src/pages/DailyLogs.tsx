import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Calendar, Camera, AlertTriangle, Filter, Check, Clock, AlertCircle, Trash2, X, ListTodo, Target, CalendarIcon, Pencil, Loader2, FileText, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NewDailyLogModal } from '@/components/NewDailyLogModal';
import { AddTaskDialog } from '@/components/dashboard/AddTaskDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/types/task';
import { format, isToday, startOfDay, startOfWeek, endOfWeek, isBefore } from 'date-fns';
import { formatDisplayDate, parseDateString } from '@/lib/dateUtils';
import { parseDescription, serializeDescription, type Subtask } from '@/lib/taskSubtasks';

interface DailyLog {
  id: string;
  project_id: string;
  date: string;
  work_performed: string | null;
  issues: string | null;
  photo_urls: string[];
  projects?: {
    name: string;
  };
}

function TaskPhotoUploader({ photos, onPhotosChange }: { photos: string[]; onPhotosChange: (urls: string[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border bg-muted cursor-pointer">
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" onClick={() => setPreviewUrl(url)} />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPhotosChange(photos.filter((_, idx) => idx !== i)); }}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-white" />
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
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          {previewUrl && <img src={previewUrl} alt="Preview" className="w-full rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DailyLogs() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('checklist');
  const [checklistTab, setChecklistTab] = useState('master');
  
  // Daily Logs state
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [editLog, setEditLog] = useState<DailyLog | null>(null);
  const [editWork, setEditWork] = useState('');
  const [editIssues, setEditIssues] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Tasks/Checklist state
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('any');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priorityLevel: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    photoUrls: [] as string[],
  });
  const [editSubtasks, setEditSubtasks] = useState<Subtask[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [dueDatePickerTaskId, setDueDatePickerTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchProjects();
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed: Task[] = (data || []).map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        description: t.description,
        dueDate: t.due_date,
        status: t.status as TaskStatus,
        priorityLevel: t.priority_level as TaskPriority,
        dailyLogId: t.daily_log_id,
        isDaily: t.is_daily,
        scheduledDate: t.scheduled_date,
        isScheduled: t.is_scheduled,
        startTime: t.start_time,
        endTime: t.end_time,
        projectId: t.project_id,
        projectName: t.projects?.name || null,
        photoUrls: t.photo_urls || [],
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      setAllTasks(transformed);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setTasksLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'checklist') {
      fetchTasks();
    }
  }, [activeTab, fetchTasks]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select(`
          *,
          projects (name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load daily logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .neq('status', 'complete')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const formatDate = (date: string) => {
    return formatDisplayDate(date, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeleteLog = async () => {
    if (!deleteLogId) return;
    const { error } = await supabase.from('daily_logs').delete().eq('id', deleteLogId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete log.', variant: 'destructive' });
    } else {
      toast({ title: 'Log deleted' });
      setLogs((prev) => prev.filter((l) => l.id !== deleteLogId));
    }
    setDeleteLogId(null);
  };

  const handleSaveEdit = async () => {
    if (!editLog) return;
    setIsSavingEdit(true);
    const { error } = await supabase
      .from('daily_logs')
      .update({ work_performed: editWork.trim() || null, issues: editIssues.trim() || null })
      .eq('id', editLog.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
    } else {
      toast({ title: 'Log updated' });
      setLogs((prev) =>
        prev.map((l) =>
          l.id === editLog.id ? { ...l, work_performed: editWork.trim() || null, issues: editIssues.trim() || null } : l
        )
      );
      setEditLog(null);
    }
    setIsSavingEdit(false);
  };

  const filteredLogs = logs.filter((log) =>
    (log.work_performed?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.issues?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.projects?.name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  // Filter tasks based on daily/master and status
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayDate = new Date();
  const weekStart = startOfWeek(todayDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(todayDate, { weekStartsOn: 0 });

  const applyExtraFilters = (task: Task) => {
    // Project filter
    if (projectFilter !== 'all' && task.projectId !== projectFilter) return false;
    // Due date filter
    if (dueDateFilter === 'overdue') {
      if (!task.dueDate || task.status === 'completed') return false;
      if (!isBefore(parseDateString(task.dueDate), startOfDay(todayDate))) return false;
    } else if (dueDateFilter === 'today') {
      if (task.dueDate !== todayStr) return false;
    } else if (dueDateFilter === 'this_week') {
      if (!task.dueDate) return false;
      const d = parseDateString(task.dueDate);
      if (d < weekStart || d > weekEnd) return false;
    } else if (dueDateFilter === 'no_date') {
      if (task.dueDate !== null) return false;
    }
    return true;
  };
  
  // Daily Sprint: tasks scheduled for today (regardless of is_daily flag)
  const dailyTasks = allTasks.filter((task) => {
    const isScheduledToday = task.scheduledDate === todayStr;
    
    if (taskFilter === 'pending') {
      if (!(isScheduledToday && task.status !== 'completed')) return false;
    } else if (taskFilter === 'completed') {
      if (!(isScheduledToday && task.status === 'completed')) return false;
    } else if (!isScheduledToday) return false;

    return applyExtraFilters(task);
  });

  // Master Pipeline: All tasks with is_daily = false (regardless of scheduled_date)
  const masterTasks = allTasks.filter((task) => {
    if (task.isDaily) return false;
    if (taskFilter === 'pending' && task.status === 'completed') return false;
    if (taskFilter === 'completed' && task.status !== 'completed') return false;
    return applyExtraFilters(task);
  });

  const tasks = checklistTab === 'daily' ? dailyTasks : masterTasks;

  // Task functions

  const handleUpdateDueDate = async (task: Task, date: Date | undefined) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ due_date: date ? format(date, 'yyyy-MM-dd') : null })
        .eq('id', task.id);

      if (error) throw error;

      // Optimistically update state immediately for instant UI response
      setAllTasks(prev => prev.map(t =>
        t.id === task.id
          ? { ...t, dueDate: date ? format(date, 'yyyy-MM-dd') : null }
          : t
      ));
      toast({ title: date ? 'Due date set' : 'Due date cleared', description: date ? `Due: ${format(date, 'MMM d, yyyy')}` : `"${task.title}" due date removed` });
      setDueDatePickerTaskId(null);
      fetchTasks(); // background sync
    } catch (error) {
      console.error('Error updating due date:', error);
      toast({ title: 'Error', description: 'Failed to update due date', variant: 'destructive' });
    }
  };

  const handleUnassignFromDay = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          scheduled_date: null  // Remove from today's sprint
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({ title: 'Removed from Today', description: `"${task.title}" removed from today's sprint` });
      fetchTasks();
    } catch (error) {
      console.error('Error unassigning task:', error);
      toast({ title: 'Error', description: 'Failed to remove task', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleInlineEdit = async (taskId: string) => {
    if (!editingTitle.trim()) {
      setEditingTaskId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title: editingTitle.trim() })
        .eq('id', taskId);

      if (error) throw error;

      setEditingTaskId(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({ title: 'Task deleted' });
      fetchTasks();
      setDetailModalOpen(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const openDetailModal = (task: Task) => {
    setSelectedTask(task);
    const parsed = parseDescription(task.description);
    setEditForm({
      title: task.title,
      description: parsed.description,
      dueDate: task.dueDate || '',
      priorityLevel: task.priorityLevel,
      status: task.status,
      photoUrls: task.photoUrls || [],
    });
    setEditSubtasks(parsed.subtasks);
    setDetailModalOpen(true);
  };

  const handleSaveDetail = async () => {
    if (!selectedTask) return;

    try {
      const finalDescription = serializeDescription(editForm.description.trim(), editSubtasks);
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editForm.title.trim(),
          description: finalDescription || null,
          due_date: editForm.dueDate || null,
          priority_level: editForm.priorityLevel,
          status: editForm.status,
          photo_urls: editForm.photoUrls,
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      // Optimistically update state immediately for instant UI response
      setAllTasks(prev => prev.map(t =>
        t.id === selectedTask.id
          ? { ...t, title: editForm.title.trim(), description: editForm.description.trim() || null, dueDate: editForm.dueDate || null, priorityLevel: editForm.priorityLevel, status: editForm.status }
          : t
      ));
      toast({ title: 'Task updated' });
      setDetailModalOpen(false);
      fetchTasks(); // background sync
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleInlinePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority_level: newPriority })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({ title: 'Error', description: 'Failed to update priority', variant: 'destructive' });
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Counts for badges (Daily Sprint = scheduled for today)
  const pendingDailyCount = allTasks.filter(t => t.scheduledDate === todayStr && t.status !== 'completed').length;
  const pendingMasterCount = allTasks.filter(t => !t.isDaily && t.status !== 'completed').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Daily Logs & Tasks</h1>
            <p className="text-muted-foreground mt-1">Track site visits and manage your checklist</p>
          </div>
          <Button size="lg" className="gap-2 w-full sm:w-auto h-12 px-6 text-base font-semibold" onClick={() => setAddTaskOpen(true)}>
            <Plus className="h-5 w-5" />
            Add Task
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:max-w-md grid-cols-2 h-12 md:h-10">
            <TabsTrigger value="checklist" className="gap-2 h-10 md:h-8">
              <Check className="h-4 w-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 h-10 md:h-8">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Daily Logs</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Daily Logs Tab */}
          <TabsContent value="logs" className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11 sm:h-10"
                />
              </div>
              <Button className="gap-2 w-full sm:w-auto h-11 sm:h-10" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                New Log Entry
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="glass-card p-5 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {filteredLogs.map((log) => {
                    const hasIssues = (log.issues?.trim().length || 0) > 0;

                    return (
                      <div
                        key={log.id}
                        className="glass-card p-5 hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(log.date)}</span>
                            </div>
                            <h3 className="font-semibold">{log.projects?.name || 'Unknown Project'}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            {hasIssues && (
                              <Badge className="bg-warning/20 text-warning border-warning/30 gap-1 mr-1">
                                <AlertTriangle className="h-3 w-3" />
                                Issue
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditLog(log);
                                setEditWork(log.work_performed || '');
                                setEditIssues(log.issues || '');
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteLogId(log.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {log.work_performed && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Work Performed</p>
                              <p className="text-sm">{log.work_performed}</p>
                            </div>
                          )}

                          {hasIssues && (
                            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                              <p className="text-sm text-muted-foreground mb-1">Issues Encountered</p>
                              <p className="text-sm text-warning">{log.issues}</p>
                            </div>
                          )}

                          {log.photo_urls && log.photo_urls.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Camera className="h-4 w-4" />
                              <span>{log.photo_urls.length} photos</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredLogs.length === 0 && (
                  <div className="text-center py-12 glass-card">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground mb-4">
                      {logs.length === 0 ? 'No daily logs yet' : 'No logs match your search'}
                    </p>
                    {logs.length === 0 && (
                      <Button onClick={() => setModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create First Log
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteLogId} onOpenChange={(open) => { if (!open) setDeleteLogId(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Daily Log?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The log entry will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteLog}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Log Dialog */}
          <Dialog open={!!editLog} onOpenChange={(open) => { if (!open) setEditLog(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Edit Log — {editLog ? formatDate(editLog.date) : ''}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Performed</label>
                  <Textarea
                    value={editWork}
                    onChange={(e) => setEditWork(e.target.value)}
                    placeholder="Describe the work completed..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issues Encountered <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Textarea
                    value={editIssues}
                    onChange={(e) => setEditIssues(e.target.value)}
                    placeholder="Any problems or concerns?"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditLog(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <TabsContent value="checklist" className="mt-6 space-y-6">
            {/* Sub-tabs for Daily Sprint vs Master Pipeline */}
            <Tabs value={checklistTab} onValueChange={setChecklistTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 h-12 md:h-10">
                <TabsTrigger value="master" className="gap-2 h-10 md:h-8">
                  <ListTodo className="h-4 w-4" />
                  <span className="hidden sm:inline">Master Pipeline</span>
                  <span className="sm:hidden">Master</span>
                  {pendingMasterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {pendingMasterCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="daily" className="gap-2 h-10 md:h-8">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Daily Sprint</span>
                  <span className="sm:hidden">Today</span>
                  {pendingDailyCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {pendingDailyCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>


            {/* Filter - Wrap on mobile */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={taskFilter} onValueChange={(v) => setTaskFilter(v as typeof taskFilter)}>
                <SelectTrigger className="w-32 sm:w-36 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-36 sm:w-44 h-10">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                <SelectTrigger className="w-32 sm:w-40 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Date</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Due Today</SelectItem>
                  <SelectItem value="this_week">Due This Week</SelectItem>
                  <SelectItem value="no_date">No Due Date</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-auto">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Mobile Card View - Hidden on md+ */}
            <div className="block md:hidden space-y-3">
              {tasksLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card p-4 animate-pulse">
                    <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))
              ) : tasks.length === 0 ? (
                <div className="glass-card p-8 text-center text-muted-foreground">
                  {checklistTab === 'daily' ? (
                    <>
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="mb-2">No tasks for today</p>
                      <p className="text-xs">Add tasks above or move items from the Master Pipeline</p>
                    </>
                  ) : (
                    <>
                      <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{taskFilter === 'pending' ? 'No pending tasks in pipeline' : 'No tasks found'}</p>
                    </>
                  )}
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`glass-card p-4 ${task.status === 'completed' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => handleToggleStatus(task)}
                        className="mt-0.5 h-5 w-5"
                      />
                      <div className="flex-1 min-w-0" onClick={() => openDetailModal(task)}>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          {checklistTab === 'master' && task.scheduledDate === todayStr && (
                            <Badge variant="outline" className="text-xs text-primary border-primary/50">
                              Today
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{task.projectName || 'Other'}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Select
                            value={task.priorityLevel}
                            onValueChange={(v) => handleInlinePriorityChange(task.id, v as TaskPriority)}
                          >
                            <SelectTrigger 
                              className={`h-6 px-2 text-xs border-0 w-auto rounded-full ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue>{TASK_PRIORITY_LABELS[task.priorityLevel]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getStatusIcon(task.status)}
                            <span>{TASK_STATUS_LABELS[task.status]}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          {task.status !== 'completed' ? (
                            <Popover open={dueDatePickerTaskId === task.id} onOpenChange={(open) => setDueDatePickerTaskId(open ? task.id : null)}>
                              <PopoverTrigger asChild>
                                <button className="text-xs text-muted-foreground cursor-pointer hover:text-primary underline-offset-2 hover:underline">
                                  {task.dueDate ? `Due: ${format(parseDateString(task.dueDate), 'MMM d, yyyy')}` : 'Set date'}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 z-[60]" align="end" side="top">
                                <CalendarPicker
                                  mode="single"
                                  selected={task.dueDate ? new Date(task.dueDate + 'T00:00:00') : undefined}
                                  onSelect={(date) => handleUpdateDueDate(task, date)}
                                  className="p-3 pointer-events-auto"
                                  initialFocus
                                />
                                {task.dueDate && (
                                  <div className="px-3 pb-3">
                                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => handleUpdateDueDate(task, undefined)}>
                                      Clear date
                                    </Button>
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
                          ) : task.dueDate ? (
                            <p className="text-xs text-muted-foreground">
                              Due: {format(parseDateString(task.dueDate), 'MMM d, yyyy')}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {checklistTab === 'daily' && !task.isDaily && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-warning"
                            onClick={() => handleUnassignFromDay(task)}
                            title="Remove from Today"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View - Hidden below md */}
            <div className="hidden md:block glass-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead className="w-32">Project</TableHead>
                    <TableHead className="w-28">Priority</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-28">Due Date</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <div className="h-8 bg-muted animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {checklistTab === 'daily' 
                          ? "No tasks scheduled for today. Add tasks above or move items from Master Pipeline."
                          : taskFilter === 'pending' 
                            ? 'No pending tasks in pipeline.' 
                            : 'No tasks found.'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow
                        key={task.id}
                        className={task.status === 'completed' ? 'opacity-60' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleToggleStatus(task)}
                          />
                        </TableCell>
                        <TableCell>
                          {editingTaskId === task.id ? (
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => handleInlineEdit(task.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineEdit(task.id);
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                              autoFocus
                              className="h-8"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span
                                className={`cursor-pointer hover:underline ${task.status === 'completed' ? 'line-through' : ''}`}
                                onClick={() => openDetailModal(task)}
                                onDoubleClick={() => {
                                  setEditingTaskId(task.id);
                                  setEditingTitle(task.title);
                                }}
                              >
                                {task.title}
                              </span>
                              {checklistTab === 'master' && task.scheduledDate === todayStr && (
                                <Badge variant="outline" className="text-xs text-primary border-primary/50">
                                  Today
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate max-w-[120px] block">
                            {task.projectName || 'Other'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={task.priorityLevel}
                            onValueChange={(v) => handleInlinePriorityChange(task.id, v as TaskPriority)}
                          >
                            <SelectTrigger className={`h-7 w-24 text-xs border-0 rounded-full ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(task.status)}
                            <span className="text-sm">{TASK_STATUS_LABELS[task.status]}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{task.dueDate ? format(parseDateString(task.dueDate), 'MMM d, yyyy') : <span className="text-muted-foreground">—</span>}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {checklistTab === 'daily' && !task.isDaily && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-warning"
                                onClick={() => handleUnassignFromDay(task)}
                                title="Remove from Today"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <NewDailyLogModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onLogCreated={fetchLogs}
      />

      {/* Task Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={editForm.priorityLevel}
                  onValueChange={(v) => setEditForm({ ...editForm, priorityLevel: v as TaskPriority })}
                >
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
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v as TaskStatus })}
                >
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
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Notes & Photos
              </Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Add notes about this task..."
                rows={3}
                className="min-h-[80px] resize-none"
              />
              <TaskPhotoUploader
                photos={editForm.photoUrls}
                onPhotosChange={(urls) => setEditForm({ ...editForm, photoUrls: urls })}
              />
            </div>
            <Collapsible defaultOpen={editSubtasks.length > 0}>
              <CollapsibleTrigger className="flex items-center gap-1.5 w-full group">
                <ListTodo className="h-4 w-4" />
                <span className="text-sm font-medium">Subtasks</span>
                {editSubtasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">{editSubtasks.length}</Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 mt-2">
                {editSubtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Checkbox
                      checked={st.done}
                      onCheckedChange={(checked) => {
                        const updated = [...editSubtasks];
                        updated[idx] = { ...updated[idx], done: !!checked };
                        setEditSubtasks(updated);
                      }}
                    />
                    <Input
                      value={st.text}
                      onChange={(e) => {
                        const updated = [...editSubtasks];
                        updated[idx] = { ...updated[idx], text: e.target.value };
                        setEditSubtasks(updated);
                      }}
                      className={cn("flex-1 h-8 text-sm", st.done && "line-through text-muted-foreground")}
                      placeholder="Subtask description"
                    />
                    <button
                      type="button"
                      onClick={() => setEditSubtasks(editSubtasks.filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full border border-dashed border-border text-muted-foreground"
                  onClick={() => setEditSubtasks([...editSubtasks, { text: '', done: false }])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Subtask
                </Button>
              </CollapsibleContent>
            </Collapsible>
            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => selectedTask && handleDeleteTask(selectedTask.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDetail}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddTaskDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} onTaskCreated={fetchTasks} />
    </MainLayout>
  );
}
