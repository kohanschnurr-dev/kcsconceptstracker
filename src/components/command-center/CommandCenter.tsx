import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { format, parse } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TimeBlockCalendar } from './TimeBlockCalendar';
import { LeisureBacklog } from './LeisureBacklog';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

export function CommandCenter() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [selectedDate] = useState(new Date());
  
  // Task detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priorityLevel: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

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
        isDaily: t.is_daily,
        scheduledDate: t.scheduled_date,
        isScheduled: t.is_scheduled,
        startTime: t.start_time,
        endTime: t.end_time,
        projectId: t.project_id,
        photoUrls: t.photo_urls || [],
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
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (title: string) => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title,
          status: 'pending',
          priority_level: 'medium',
          is_daily: false,
          is_scheduled: false,
        });

      if (error) throw error;

      toast({ title: 'Task added to backlog' });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    } finally {
      setIsCreating(false);
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskData = active.data.current?.task as Task | undefined;
    if (taskData) {
      setActiveDragTask(taskData);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (!over) return;

    const draggedTask = active.data.current?.task as Task | undefined;
    const source = active.data.current?.source as string | undefined;
    const overId = over.id.toString();

    if (!draggedTask) return;

    // Dropping on a time slot from leisure backlog
    if (overId.startsWith('timeslot-') && source === 'leisure') {
      const time = over.data.current?.time as string;
      if (!time) return;

      try {
        const todayStr = format(selectedDate, 'yyyy-MM-dd');
        const startTime = `${time}:00`;
        // Default to 1 hour duration
        const startHour = parseInt(time.split(':')[0]);
        const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00:00`;

        const { error } = await supabase
          .from('tasks')
          .update({
            is_scheduled: true,
            scheduled_date: todayStr,
            start_time: startTime,
            end_time: endTime,
            is_daily: true,
          })
          .eq('id', draggedTask.id);

        if (error) throw error;

        toast({
          title: 'Task scheduled',
          description: `"${draggedTask.title}" scheduled for ${format(parse(time, 'HH:mm', new Date()), 'h:mm a')}`,
        });
        fetchTasks();
      } catch (error) {
        console.error('Error scheduling task:', error);
        toast({ title: 'Error', description: 'Failed to schedule task', variant: 'destructive' });
      }
    }

    // Dropping on leisure backlog from calendar
    if (overId === 'leisure-backlog' && source === 'calendar') {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            is_scheduled: false,
            start_time: null,
            end_time: null,
          })
          .eq('id', draggedTask.id);

        if (error) throw error;

        toast({
          title: 'Task unscheduled',
          description: `"${draggedTask.title}" moved back to backlog`,
        });
        fetchTasks();
      } catch (error) {
        console.error('Error unscheduling task:', error);
        toast({ title: 'Error', description: 'Failed to unschedule task', variant: 'destructive' });
      }
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

  if (isLoading) {
    return (
      <div className="h-[600px] md:h-[700px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading Command Center...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-[600px] md:h-[700px] flex flex-col md:flex-row gap-4 md:gap-0 border border-border rounded-lg overflow-hidden bg-card">
        {/* Left: Time-Blocked Calendar (stacks on top for mobile) */}
        <div className="flex-1 md:flex-[2] border-b md:border-b-0 md:border-r border-border overflow-hidden">
          <TimeBlockCalendar
            tasks={tasks}
            selectedDate={selectedDate}
            onTaskClick={openDetailModal}
          />
        </div>

        {/* Right: Leisure Backlog */}
        <div className="flex-1 md:flex-[1] overflow-hidden" id="leisure-backlog">
          <LeisureBacklog
            tasks={tasks}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onTaskClick={openDetailModal}
            isCreating={isCreating}
          />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragTask ? (
          <div className="glass-card p-3 flex items-center gap-2 shadow-xl opacity-90">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{activeDragTask.title}</span>
          </div>
        ) : null}
      </DragOverlay>

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
    </DndContext>
  );
}
