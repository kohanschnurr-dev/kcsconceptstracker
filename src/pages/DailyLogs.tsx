import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar, Camera, AlertTriangle, Filter, Check, Clock, AlertCircle, Trash2 } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NewDailyLogModal } from '@/components/NewDailyLogModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/types/task';
import { format } from 'date-fns';

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
  const [activeTab, setActiveTab] = useState('logs');
  
  // Daily Logs state
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Tasks/Checklist state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
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

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (taskFilter === 'pending') {
        query = query.in('status', ['pending', 'in_progress']);
      } else if (taskFilter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformed: Task[] = (data || []).map((t) => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        description: t.description,
        dueDate: t.due_date,
        status: t.status as TaskStatus,
        priorityLevel: t.priority_level as TaskPriority,
        dailyLogId: t.daily_log_id,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      setTasks(transformed);
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
  }, [taskFilter, toast]);

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredLogs = logs.filter((log) =>
    (log.work_performed?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.issues?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.projects?.name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  // Task functions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTaskTitle.trim(),
          status: 'pending',
          priority_level: 'medium',
        });

      if (error) throw error;

      setNewTaskTitle('');
      toast({ title: 'Task created', description: 'Your task has been added.' });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    } finally {
      setIsCreating(false);
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
            <TabsTrigger value="logs" className="gap-2 py-3 md:py-2">
              <Calendar className="h-4 w-4" />
              Daily Logs
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-2 py-3 md:py-2">
              <Check className="h-4 w-4" />
              Checklist
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
                        className="glass-card p-5 hover:border-primary/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(log.date)}</span>
                            </div>
                            <h3 className="font-semibold">{log.projects?.name || 'Unknown Project'}</h3>
                          </div>
                          {hasIssues && (
                            <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Issue
                            </Badge>
                          )}
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

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="mt-6 space-y-6">
            {/* Quick Add - Stacked on mobile */}
            <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <div className="relative flex-1">
                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Add a new task... (press Enter)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="pl-9 h-11 sm:h-10"
                  disabled={isCreating}
                />
              </div>
              <Button 
                type="submit" 
                disabled={!newTaskTitle.trim() || isCreating}
                className="w-full sm:w-auto h-11 sm:h-10"
              >
                Add Task
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
                  {taskFilter === 'pending' ? 'No pending tasks. Great job!' : 'No tasks found.'}
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
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}
                          >
                            {TASK_PRIORITY_LABELS[task.priorityLevel]}
                          </Badge>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                    <TableHead className="w-28">Priority</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-28">Due Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <div className="h-8 bg-muted animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {taskFilter === 'pending' ? 'No pending tasks. Great job!' : 'No tasks found.'}
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
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${TASK_PRIORITY_COLORS[task.priorityLevel]}`}
                          >
                            {TASK_PRIORITY_LABELS[task.priorityLevel]}
                          </Badge>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
