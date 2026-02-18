import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar, Camera, AlertTriangle, Filter, Check, Clock, AlertCircle, Trash2, CalendarPlus, X, ListTodo, Target, CalendarIcon, Pencil } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/types/task';
import { format, isToday, startOfDay } from 'date-fns';
import { formatDisplayDate } from '@/lib/dateUtils';

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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [isCreating, setIsCreating] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priorityLevel: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
  });
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

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
  
  // Daily Sprint: tasks scheduled for today (regardless of is_daily flag)
  const dailyTasks = allTasks.filter((task) => {
    const isScheduledToday = task.scheduledDate === todayStr;
    
    if (taskFilter === 'pending') {
      return isScheduledToday && task.status !== 'completed';
    } else if (taskFilter === 'completed') {
      return isScheduledToday && task.status === 'completed';
    }
    return isScheduledToday;
  });

  // Master Pipeline: All tasks with is_daily = false (regardless of scheduled_date)
  const masterTasks = allTasks.filter((task) => {
    if (!task.isDaily) {
      if (taskFilter === 'pending') {
        return task.status !== 'completed';
      } else if (taskFilter === 'completed') {
        return task.status === 'completed';
      }
      return true;
    }
    return false;
  });

  const tasks = checklistTab === 'daily' ? dailyTasks : masterTasks;

  // Task functions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If on Daily Sprint tab, create as a daily task for today
      const isDaily = checklistTab === 'daily';
      
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTaskTitle.trim(),
          status: 'pending',
          priority_level: 'medium',
          is_daily: isDaily,
          scheduled_date: isDaily ? todayStr : null,
          project_id: newTaskProjectId === 'none' || newTaskProjectId === '' ? null : newTaskProjectId,
          due_date: newTaskDueDate ? format(newTaskDueDate, 'yyyy-MM-dd') : null,
        });

      if (error) throw error;

      setNewTaskTitle('');
      setNewTaskProjectId('');
      setNewTaskDueDate(undefined);
      toast({ 
        title: 'Task created', 
        description: isDaily ? 'Added to today\'s sprint' : 'Added to master pipeline' 
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignToToday = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          scheduled_date: todayStr  // Only set date, keep is_daily unchanged
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({ title: 'Assigned to Today', description: `"${task.title}" added to today's sprint` });
      fetchTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({ title: 'Error', description: 'Failed to assign task', variant: 'destructive' });
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
    setEditForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      priorityLevel: task.priorityLevel,
      status: task.status,
    });
    setDetailModalOpen(true);
  };

  const handleSaveDetail = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          due_date: editForm.dueDate || null,
          priority_level: editForm.priorityLevel,
          status: editForm.status,
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast({ title: 'Task updated' });
      setDetailModalOpen(false);
      fetchTasks();
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:max-w-md grid-cols-2">
            <TabsTrigger value="checklist" className="gap-2 py-3 md:py-2">
              <Check className="h-4 w-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 py-3 md:py-2">
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
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="master" className="gap-2">
                  <ListTodo className="h-4 w-4" />
                  <span className="hidden sm:inline">Master Pipeline</span>
                  <span className="sm:hidden">Master</span>
                  {pendingMasterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {pendingMasterCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="daily" className="gap-2">
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

            {/* Quick Add - contextual to the current tab */}
            <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <div className="relative flex-1">
                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={checklistTab === 'daily' 
                    ? "Add task to today's list... (press Enter)" 
                    : "Add to master pipeline... (press Enter)"
                  }
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="pl-9 h-11 sm:h-10"
                  disabled={isCreating}
                />
              </div>
              {checklistTab === 'master' && (
                <Select value={newTaskProjectId} onValueChange={setNewTaskProjectId}>
                  <SelectTrigger className="w-full sm:w-44 h-11 sm:h-10">
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Other (No Project)</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {checklistTab === 'master' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "shrink-0 gap-1 h-11 sm:h-10",
                        newTaskDueDate && "text-primary"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {newTaskDueDate && <span className="text-xs">{format(newTaskDueDate, 'MMM d')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarPicker
                      mode="single"
                      selected={newTaskDueDate}
                      onSelect={setNewTaskDueDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                    {newTaskDueDate && (
                      <div className="px-3 pb-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setNewTaskDueDate(undefined)}
                        >
                          <X className="h-3 w-3 mr-1" /> Clear date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}
              <Button 
                type="submit" 
                disabled={!newTaskTitle.trim() || isCreating || (checklistTab === 'master' && !newTaskProjectId)}
                className="w-full sm:w-auto h-11 sm:h-10"
              >
                {checklistTab === 'daily' ? 'Add to Today' : 'Add to Pipeline'}
              </Button>
            </form>

            {/* Filter - Wrap on mobile */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={taskFilter} onValueChange={(v) => setTaskFilter(v as typeof taskFilter)}>
                <SelectTrigger className="w-36 sm:w-40 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-auto sm:ml-2">
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
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {checklistTab === 'master' && task.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-primary hover:text-primary/80"
                            onClick={() => handleAssignToToday(task)}
                            title="Assign to Today"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                        )}
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
            <div className="hidden md:block glass-card overflow-hidden">
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
                          {task.dueDate ? (
                            <span className="text-sm">{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {checklistTab === 'master' && task.status !== 'completed' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary/80"
                                onClick={() => handleAssignToToday(task)}
                                title="Assign to Today"
                              >
                                <CalendarPlus className="h-4 w-4" />
                              </Button>
                            )}
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
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Add details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              />
            </div>
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
    </MainLayout>
  );
}
