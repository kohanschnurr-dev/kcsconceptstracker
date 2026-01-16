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
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
