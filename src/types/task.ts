export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  priorityLevel: TaskPriority;
  dailyLogId: string | null;
  isDaily: boolean;
  scheduledDate: string | null;
  isScheduled: boolean;
  startTime: string | null;
  endTime: string | null;
  projectId: string | null;
  projectName?: string | null;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/15 text-blue-600 border border-blue-500/20',
  high: 'bg-orange-500/15 text-orange-600 border border-orange-500/20',
  urgent: 'bg-red-500/15 text-red-600 border border-red-500/20',
};
