import { useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  startOfDay,
  isWithinInterval
} from 'date-fns';
import { cn } from '@/lib/utils';
import { DealCard } from './DealCard';
import type { CalendarTask } from '@/pages/Calendar';

interface MonthlyViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
}

export function MonthlyView({ currentDate, tasks, onTaskClick }: MonthlyViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getTasksForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    return tasks.filter(task => {
      const taskStart = startOfDay(task.startDate);
      const taskEnd = startOfDay(task.endDate);
      return isWithinInterval(dayStart, { start: taskStart, end: taskEnd });
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[120px] p-2 rounded-lg border transition-colors',
                isCurrentMonth 
                  ? 'bg-slate-800/50 border-slate-700' 
                  : 'bg-slate-900/50 border-slate-800',
                isToday(day) && 'ring-2 ring-emerald-500/50'
              )}
            >
              <div className={cn(
                'text-sm font-medium mb-1',
                isToday(day) 
                  ? 'text-emerald-400' 
                  : isCurrentMonth 
                    ? 'text-white' 
                    : 'text-slate-600'
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <DealCard
                    key={task.id}
                    task={task}
                    compact
                    onClick={() => onTaskClick(task)}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-slate-500 text-center">
                    +{dayTasks.length - 3} more
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
