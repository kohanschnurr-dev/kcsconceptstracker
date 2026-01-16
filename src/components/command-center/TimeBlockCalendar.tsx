import { useDroppable } from '@dnd-kit/core';
import { format, parse, addMinutes, setHours, setMinutes } from 'date-fns';
import { Clock, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';
import { TASK_PRIORITY_COLORS } from '@/types/task';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface TimeSlotProps {
  time: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function DraggableScheduledTask({ 
  task, 
  onClick 
}: { 
  task: Task; 
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `scheduled-${task.id}`,
    data: { task, source: 'calendar' },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Calculate duration based on start/end time
  const getDurationMinutes = () => {
    if (!task.startTime || !task.endTime) return 30;
    const start = parse(task.startTime, 'HH:mm:ss', new Date());
    const end = parse(task.endTime, 'HH:mm:ss', new Date());
    return (end.getTime() - start.getTime()) / 60000;
  };

  const duration = getDurationMinutes();
  const heightPx = Math.max(40, (duration / 60) * 60); // 60px per hour, min 40px

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, height: `${heightPx}px` }}
      className={cn(
        'absolute left-16 right-2 bg-primary/90 text-primary-foreground rounded-md px-2 py-1 cursor-grab active:cursor-grabbing shadow-md transition-opacity z-10',
        isDragging && 'opacity-50',
        TASK_PRIORITY_COLORS[task.priorityLevel]?.includes('urgent') && 'bg-destructive/90',
        TASK_PRIORITY_COLORS[task.priorityLevel]?.includes('high') && 'bg-orange-500/90'
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-1 h-full" onClick={onClick}>
        <GripVertical className="h-3 w-3 opacity-50 shrink-0" />
        <span className="text-xs font-medium truncate flex-1">{task.title}</span>
        {duration >= 60 && (
          <span className="text-[10px] opacity-70">
            {format(parse(task.startTime!, 'HH:mm:ss', new Date()), 'h:mm a')}
          </span>
        )}
      </div>
    </div>
  );
}

function TimeSlot({ time, tasks, onTaskClick }: TimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeslot-${time}`,
    data: { time },
  });

  const slotTasks = tasks.filter((t) => {
    if (!t.startTime) return false;
    const taskHour = t.startTime.substring(0, 5);
    return taskHour === time;
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative h-[60px] border-b border-border/50 transition-colors',
        isOver && 'bg-primary/10'
      )}
    >
      <div className="absolute left-0 top-0 w-14 text-xs text-muted-foreground py-1 px-2">
        {format(parse(time, 'HH:mm', new Date()), 'h a')}
      </div>
      <div className="absolute left-14 right-0 top-0 bottom-0 border-l border-border/30">
        {slotTasks.map((task) => (
          <DraggableScheduledTask
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </div>
  );
}

interface TimeBlockCalendarProps {
  tasks: Task[];
  selectedDate: Date;
  onTaskClick: (task: Task) => void;
}

export function TimeBlockCalendar({ tasks, selectedDate, onTaskClick }: TimeBlockCalendarProps) {
  // Generate time slots from 6 AM to 8 PM
  const timeSlots: string[] = [];
  for (let hour = 6; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Filter tasks for selected date that are scheduled
  const scheduledTasks = tasks.filter((task) => {
    if (!task.isScheduled || !task.scheduledDate || !task.startTime) return false;
    return task.scheduledDate === format(selectedDate, 'yyyy-MM-dd');
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Today's Schedule</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {format(selectedDate, 'EEEE, MMMM d')}
        </span>
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          {timeSlots.map((time) => (
            <TimeSlot
              key={time}
              time={time}
              tasks={scheduledTasks}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
