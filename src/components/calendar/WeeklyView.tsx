import { useMemo } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isToday,
  format
} from 'date-fns';
import { cn } from '@/lib/utils';
import { DealCard } from './DealCard';
import type { CalendarTask } from '@/pages/Calendar';

interface WeeklyViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
}

export function WeeklyView({ currentDate, tasks, onTaskClick }: WeeklyViewProps) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      return date >= taskStart && date <= taskEnd;
    });
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-3">
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[400px] p-3 rounded-lg border transition-colors',
                'bg-slate-800/50 border-slate-700',
                isToday(day) && 'ring-2 ring-emerald-500/50'
              )}
            >
              <div className={cn(
                'text-center mb-3 pb-2 border-b border-slate-700',
              )}>
                <p className="text-xs text-slate-500 uppercase">
                  {format(day, 'EEE')}
                </p>
                <p className={cn(
                  'text-2xl font-bold',
                  isToday(day) ? 'text-emerald-400' : 'text-white'
                )}>
                  {format(day, 'd')}
                </p>
              </div>
              
              <div className="space-y-2">
                {dayTasks.map(task => (
                  <DealCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                  />
                ))}
                {dayTasks.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
