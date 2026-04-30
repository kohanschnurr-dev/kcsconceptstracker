import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryStyles } from '@/lib/calendarCategories';
import type { CalendarTask } from '@/pages/Calendar';

interface EventBarProps {
  task: CalendarTask;
  continuesLeft?: boolean;
  continuesRight?: boolean;
  onClick?: () => void;
  /** Visual height in px. Defaults to 22. */
  height?: number;
  /** When true, applies dragging styles (lower opacity). */
  isDragging?: boolean;
}

/**
 * Continuous spanning bar used by MonthlyView and WeeklyView.
 * Pure presentational — drag handles are wired by the parent.
 */
export function EventBar({
  task,
  continuesLeft,
  continuesRight,
  onClick,
  height = 22,
  isDragging,
}: EventBarProps) {
  const styles = getCategoryStyles(task.eventCategory || 'due_diligence');
  const critical = task.isCriticalPath && !task.isCompleted;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{ height }}
      className={cn(
        'w-full flex items-center gap-1 px-1.5 text-[11px] leading-none border transition-all',
        'cursor-grab active:cursor-grabbing select-none overflow-hidden',
        'hover:brightness-110 hover:ring-1 hover:ring-primary/40',
        critical
          ? 'bg-red-200 dark:bg-red-500/30 border-red-500 text-foreground'
          : `${styles.bgClass} ${styles.borderClass} text-foreground`,
        // Rounded only on the true ends of the event
        continuesLeft ? 'rounded-l-none border-l-0' : 'rounded-l-md',
        continuesRight ? 'rounded-r-none border-r-0' : 'rounded-r-md',
        isDragging && 'opacity-40',
      )}
    >
      {task.isCompleted && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
      {!task.isCompleted && critical && (
        <AlertTriangle className="h-3 w-3 shrink-0" />
      )}
      <span className="truncate font-medium">{task.title}</span>
    </button>
  );
}
