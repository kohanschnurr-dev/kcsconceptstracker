import { useMemo, useState, useRef } from 'react';
import { 
  startOfWeek, 
  addDays,
  differenceInDays,
  format,
  isToday,
  addWeeks
} from 'date-fns';
import { 
  Hammer, 
  Pipette, 
  Zap, 
  Landmark, 
  Fan, 
  PaintBucket,
  Wrench,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  Calendar,
  Home,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CalendarTask } from '@/pages/Calendar';
import { getCategoryGroup, getCategoryStyles } from '@/lib/calendarCategories';

interface GanttViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
}

export function GanttView({ currentDate, tasks, onTaskClick, onTaskMove }: GanttViewProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Show 4 weeks starting from the beginning of current week
  const startDate = startOfWeek(currentDate);
  const days = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  const getCategoryIcon = (category: string) => {
    const iconClass = 'h-3 w-3';
    const group = getCategoryGroup(category);
    
    switch (group) {
      case 'acquisition_admin':
        return <FileText className={iconClass} />;
      case 'structural_exterior':
        return <Landmark className={iconClass} />;
      case 'rough_ins':
        switch (category) {
          case 'plumbing_rough': return <Pipette className={iconClass} />;
          case 'electrical_rough': return <Zap className={iconClass} />;
          case 'hvac_rough': return <Fan className={iconClass} />;
          case 'framing': return <Hammer className={iconClass} />;
          default: return <Wrench className={iconClass} />;
        }
      case 'inspections':
        return <ClipboardCheck className={iconClass} />;
      case 'interior_finishes':
        return <PaintBucket className={iconClass} />;
      case 'milestones':
        switch (category) {
          case 'listing_date': return <Calendar className={iconClass} />;
          case 'open_house': return <Home className={iconClass} />;
          case 'stage_clean': return <Sparkles className={iconClass} />;
          default: return <Calendar className={iconClass} />;
        }
      default:
        return <Wrench className={iconClass} />;
    }
  };

  const getBarColor = (task: CalendarTask) => {
    if (task.status === 'complete') return 'bg-emerald-600';
    switch (task.budgetHealth) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
    }
  };

  const getTaskPosition = (task: CalendarTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const endDate = addDays(startDate, 27);
    
    // Check if task is visible in this range
    if (taskEnd < startDate || taskStart > endDate) return null;

    const startOffset = Math.max(0, differenceInDays(taskStart, startDate));
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    const adjustedStart = taskStart < startDate ? 0 : startOffset;
    const adjustedDuration = Math.min(28 - adjustedStart, duration);

    return {
      left: `${(adjustedStart / 28) * 100}%`,
      width: `${(adjustedDuration / 28) * 100}%`,
    };
  };

  const hasDependencyWarning = (task: CalendarTask) => {
    if (!task.dependsOn) return false;
    for (const depId of task.dependsOn) {
      const depTask = tasks.find(t => t.id === depId);
      if (depTask && depTask.status !== 'complete') {
        if (new Date(task.startDate) < new Date(depTask.endDate)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!draggedTask || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dayIndex = Math.floor((x / rect.width) * 28);
    
    const task = tasks.find(t => t.id === draggedTask);
    if (!task) return;

    const duration = differenceInDays(new Date(task.endDate), new Date(task.startDate));
    const newStart = addDays(startDate, Math.max(0, Math.min(27 - duration, dayIndex)));
    const newEnd = addDays(newStart, duration);

    onTaskMove(draggedTask, newStart, newEnd);
    setDraggedTask(null);
  };

  // Group tasks by project
  const groupedTasks = useMemo(() => {
    const groups: Record<string, CalendarTask[]> = {};
    tasks.forEach(task => {
      if (!groups[task.projectName]) {
        groups[task.projectName] = [];
      }
      groups[task.projectName].push(task);
    });
    return groups;
  }, [tasks]);

  return (
    <div className="p-4">
      {/* Header with days */}
      <div className="flex border-b border-slate-700 pb-2 mb-4">
        <div className="w-48 shrink-0 text-xs font-medium text-slate-400">
          Project / Task
        </div>
        <div className="flex-1 flex">
          {days.map((day, i) => (
            <div 
              key={i} 
              className={cn(
                'flex-1 text-center text-[10px]',
                isToday(day) ? 'text-emerald-400 font-bold' : 'text-slate-500'
              )}
            >
              <div>{format(day, 'EEE')}</div>
              <div className={cn(
                'font-medium',
                isToday(day) ? 'text-emerald-400' : 'text-slate-400'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt chart body */}
      <div className="space-y-1">
        {Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
          <div key={projectName}>
            {/* Project header */}
            <div className="flex items-center py-2 border-b border-slate-800">
              <div className="w-48 shrink-0">
                <span className="text-sm font-semibold text-white">{projectName}</span>
              </div>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Tasks */}
            {projectTasks.map(task => {
              const position = getTaskPosition(task);
              if (!position) return null;

              return (
                <div key={task.id} className="flex items-center py-1.5 group">
                  <div className="w-48 shrink-0 pr-2">
                    <button
                      onClick={() => onTaskClick(task)}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      {getCategoryIcon(task.eventCategory || 'due_diligence')}
                      <span className="truncate">{task.title}</span>
                      {hasDependencyWarning(task) && (
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-amber-900 border-amber-700">
                            <p className="text-xs">Dependency not complete!</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </button>
                  </div>
                  
                  <div 
                    ref={containerRef}
                    className="flex-1 relative h-6"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDragEnd}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {days.map((day, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            'flex-1 border-l border-slate-800/50',
                            isToday(day) && 'bg-emerald-500/5'
                          )}
                        />
                      ))}
                    </div>

                    {/* Task bar */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => onTaskClick(task)}
                          className={cn(
                            'absolute top-0.5 h-5 rounded cursor-grab active:cursor-grabbing transition-all',
                            'hover:ring-2 hover:ring-white/20',
                            getBarColor(task),
                            draggedTask === task.id && 'opacity-50'
                          )}
                          style={position}
                        >
                        <div className="flex items-center h-full px-2 gap-1">
                            {getCategoryIcon(task.eventCategory || 'due_diligence')}
                            <span className="text-[10px] text-white font-medium truncate">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-slate-700">
                        <div className="text-xs">
                          <p className="font-medium text-white">{task.title}</p>
                          <p className="text-slate-400">
                            {format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.endDate), 'MMM d')}
                          </p>
                          <p className="text-slate-400">
                            {task.checklist.filter(c => c.completed).length}/{task.checklist.length} tasks complete
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-500">Budget Health:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-xs text-slate-400">On Budget</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-xs text-slate-400">At Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500" />
          <span className="text-xs text-slate-400">Over Budget</span>
        </div>
      </div>
    </div>
  );
}
