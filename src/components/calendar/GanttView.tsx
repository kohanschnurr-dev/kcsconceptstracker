import { useMemo, useState, useRef, type ReactNode } from 'react';
import { 
  startOfWeek, 
  addDays,
  differenceInDays,
  format,
  isToday,
} from 'date-fns';
import { 
  AlertTriangle, Wrench, Zap, Snowflake, Hammer, Paintbrush, Layers, 
  Grid3x3, Square, DoorOpen, PaintBucket, Home, Landmark, TreePine, 
  Warehouse, Sparkles, CalendarDays, DollarSign, Package, CheckCircle, 
  ClipboardList, FileText, ZoomIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { CalendarTask } from '@/pages/Calendar';
import { getCategoryGroup, CATEGORY_GROUPS } from '@/lib/calendarCategories';

interface GanttViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onTaskMove: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
}

const getCategoryIcon = (category: string, size = 12, className = ''): ReactNode => {
  const props = { size, className, strokeWidth: 2 };
  switch (category) {
    case 'plumbing_rough': return <Wrench {...props} />;
    case 'electrical_rough': return <Zap {...props} />;
    case 'hvac_rough': return <Snowflake {...props} />;
    case 'framing': case 'demo': return <Hammer {...props} />;
    case 'painting': case 'exterior_paint': return <Paintbrush {...props} />;
    case 'flooring': return <Layers {...props} />;
    case 'tile': case 'countertops': return <Grid3x3 {...props} />;
    case 'cabinetry': return <Square {...props} />;
    case 'windows': return <DoorOpen {...props} />;
    case 'drywall': return <PaintBucket {...props} />;
    case 'roofing': case 'siding': case 'open_house': return <Home {...props} />;
    case 'foundation_piers': return <Landmark {...props} />;
    case 'grading': return <TreePine {...props} />;
    case 'garage': return <Warehouse {...props} />;
    case 'stage_clean': return <Sparkles {...props} />;
    case 'listing_date': case 'sale_closing': case 'closing': return <CalendarDays {...props} />;
    case 'purchase': case 'refinancing': return <DollarSign {...props} />;
    case 'order': case 'item_arrived': return <Package {...props} />;
    case 'city_rough_in': case 'third_party': case 'foundation_pre_pour': case 'final_green_tag': return <CheckCircle {...props} />;
    case 'permitting': return <ClipboardList {...props} />;
    case 'due_diligence': case 'underwriting': return <FileText {...props} />;
    default: {
      const group = getCategoryGroup(category);
      switch (group) {
        case 'acquisition_admin': return <FileText {...props} />;
        case 'structural_exterior': return <Home {...props} />;
        case 'rough_ins': return <Wrench {...props} />;
        case 'inspections': return <CheckCircle {...props} />;
        case 'interior_finishes': return <Paintbrush {...props} />;
        case 'milestones': return <CalendarDays {...props} />;
        default: return <Wrench {...props} />;
      }
    }
  }
};

export function GanttView({ currentDate, tasks, onTaskClick, onTaskMove }: GanttViewProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [zoomDays, setZoomDays] = useState(7);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startDate = startOfWeek(currentDate);
  const days = useMemo(() => {
    return Array.from({ length: zoomDays }, (_, i) => addDays(startDate, i));
  }, [startDate, zoomDays]);

  const todayIndex = days.findIndex(day => isToday(day));
  const isZoomed = zoomDays < 21;
  const colMinWidth = isZoomed ? 80 : undefined;

  const groupColorMap: Record<string, string> = {
    acquisition_admin: 'bg-blue-500',
    structural_exterior: 'bg-red-500',
    rough_ins: 'bg-orange-500',
    inspections: 'bg-purple-500',
    interior_finishes: 'bg-emerald-500',
    milestones: 'bg-amber-500',
  };

  const getBarColor = (task: CalendarTask) => {
    const group = getCategoryGroup(task.eventCategory || 'due_diligence');
    const color = groupColorMap[group] || 'bg-slate-500';
    return task.status === 'complete' ? `${color} opacity-60` : color;
  };

  const getTaskPosition = (task: CalendarTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const endDate = addDays(startDate, zoomDays - 1);
    if (taskEnd < startDate || taskStart > endDate) return null;
    const startOffset = Math.max(0, differenceInDays(taskStart, startDate));
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    const adjustedStart = taskStart < startDate ? 0 : startOffset;
    const adjustedDuration = Math.min(zoomDays - adjustedStart, duration);
    return {
      left: `${(adjustedStart / zoomDays) * 100}%`,
      width: `${(adjustedDuration / zoomDays) * 100}%`,
    };
  };

  const hasDependencyWarning = (task: CalendarTask) => {
    if (!task.dependsOn) return false;
    for (const depId of task.dependsOn) {
      const depTask = tasks.find(t => t.id === depId);
      if (depTask && depTask.status !== 'complete') {
        if (new Date(task.startDate) < new Date(depTask.endDate)) return true;
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
    const dayIndex = Math.floor((x / rect.width) * zoomDays);
    const task = tasks.find(t => t.id === draggedTask);
    if (!task) return;
    const duration = differenceInDays(new Date(task.endDate), new Date(task.startDate));
    const newStart = addDays(startDate, Math.max(0, Math.min(zoomDays - 1 - duration, dayIndex)));
    const newEnd = addDays(newStart, duration);
    onTaskMove(draggedTask, newStart, newEnd);
    setDraggedTask(null);
  };

  const groupedTasks = useMemo(() => {
    const groups: Record<string, CalendarTask[]> = {};
    tasks.forEach(task => {
      if (!groups[task.projectName]) groups[task.projectName] = [];
      groups[task.projectName].push(task);
    });
    return groups;
  }, [tasks]);

  return (
    <div className="p-4">
      {/* Zoom toolbar */}
      <div className="flex items-center gap-3 mb-4 bg-secondary/50 rounded-lg p-2 flex-wrap">
        <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 px-2.5 text-xs rounded-full',
              zoomDays === 7 && 'bg-primary text-primary-foreground border-primary'
            )}
            onClick={() => setZoomDays(7)}
          >
            7d
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 px-2.5 text-xs rounded-full',
              zoomDays === 14 && 'bg-primary text-primary-foreground border-primary'
            )}
            onClick={() => setZoomDays(14)}
          >
            14d
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 px-2.5 text-xs rounded-full',
              zoomDays === 21 && 'bg-primary text-primary-foreground border-primary'
            )}
            onClick={() => setZoomDays(21)}
          >
            21d
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[120px] max-w-[200px]">
          <Slider
            value={[zoomDays]}
            onValueChange={([v]) => setZoomDays(v)}
            min={7}
            max={21}
            step={1}
            className="flex-1"
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {zoomDays} days
        </span>
      </div>

      {/* Scrollable chart area */}
      <div
        ref={scrollRef}
        className={cn(isZoomed && 'overflow-x-auto')}
        style={{ scrollBehavior: 'smooth' }}
      >
        <div style={{ minWidth: colMinWidth ? colMinWidth * zoomDays + 192 : undefined }}>
          {/* Header with days */}
          <div className="flex border-b border-border pb-2 mb-4">
            <div className="w-48 shrink-0 text-xs font-medium text-muted-foreground">
              Project / Task
            </div>
            <div className="flex-1 flex">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 text-center text-[10px]',
                    isToday(day) ? 'text-primary font-bold' : 'text-muted-foreground'
                  )}
                  style={colMinWidth ? { minWidth: colMinWidth } : undefined}
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className={cn(
                    'font-medium',
                    isToday(day) ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gantt chart body */}
          <div>
            {Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
              <div key={projectName}>
                <div className="flex items-center py-2 border-b border-border">
                  <div className="w-48 shrink-0">
                    <span className="text-sm font-semibold text-foreground">{projectName}</span>
                  </div>
                </div>

                {projectTasks.map(task => {
                  const position = getTaskPosition(task);
                  if (!position) return null;

                  return (
                    <div key={task.id} className="flex items-center py-1.5 group">
                      <div className="w-48 shrink-0 pr-2">
                        <button
                          onClick={() => onTaskClick(task)}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {getCategoryIcon(task.eventCategory || 'due_diligence', 12, 'text-muted-foreground')}
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
                        className="flex-1 relative h-7"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDragEnd}
                      >
                        {todayIndex !== -1 && (
                          <div
                            className="absolute top-0 bottom-0 bg-foreground/[0.03] pointer-events-none"
                            style={{
                              left: `${(todayIndex / zoomDays) * 100}%`,
                              width: `${(1 / zoomDays) * 100}%`,
                            }}
                          />
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onClick={() => onTaskClick(task)}
                              className={cn(
                                'absolute top-0.5 h-6 rounded cursor-grab active:cursor-grabbing transition-all',
                                'hover:ring-2 hover:ring-white/20',
                                getBarColor(task),
                                draggedTask === task.id && 'opacity-50'
                              )}
                              style={position}
                            >
                              <div className="flex items-center h-full gap-1 px-1.5 overflow-hidden">
                                {getCategoryIcon(task.eventCategory || 'due_diligence', 12, 'text-white shrink-0')}
                                {isZoomed && (
                                  <span className="text-[10px] text-white truncate leading-none">
                                    {task.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-card border-border">
                            <div className="text-xs">
                              <p className="font-medium text-foreground">{task.title}</p>
                              <p className="text-muted-foreground">
                                {format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.endDate), 'MMM d')}
                              </p>
                              <p className="text-muted-foreground">
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
        </div>
      </div>
    </div>
  );
}
