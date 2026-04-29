import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, GanttChart, List, X } from 'lucide-react';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import type { CalendarView } from '@/pages/Calendar';
import { WeatherWidget } from './WeatherWidget';
import { CalendarLegend } from './CalendarLegend';
import { useProfile } from '@/hooks/useProfile';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface CalendarHeaderProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  projects?: Project[];
  selectedProjectId?: string | null;
  onProjectFilterChange?: (projectId: string | null) => void;
  onAddEvent?: React.ReactNode;
}

function WeatherWidgetWithCity() {
  const { profile } = useProfile();
  return <WeatherWidget city={(profile as any)?.city} state={(profile as any)?.state} />;
}

export function CalendarHeader({ 
  view, 
  onViewChange, 
  currentDate, 
  onDateChange,
  projects = [],
  selectedProjectId,
  onProjectFilterChange,
  onAddEvent,
}: CalendarHeaderProps) {
  const handlePrev = () => {
    if (view === 'monthly') {
      onDateChange(subMonths(currentDate, 1));
    } else {
      onDateChange(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'monthly') {
      onDateChange(addMonths(currentDate, 1));
    } else {
      onDateChange(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateLabel = () => {
    if (view === 'monthly') {
      return format(currentDate, 'MMMM yyyy');
    }
    return format(currentDate, "'Week of' MMM d, yyyy");
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="bg-card rounded-xl p-3 border border-border">
      {/* ── Mobile layout (3 rows + legend) ── */}
      <div className="sm:hidden flex flex-col gap-2">
        {/* Row 1: Title | View selector + Add button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-base font-bold text-foreground">Project Calendar</h1>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Select value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
              <SelectTrigger className="h-8 w-[82px] text-xs bg-card border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="monthly">
                  <span className="flex items-center gap-1.5"><LayoutGrid className="h-3.5 w-3.5" />Calendar</span>
                </SelectItem>
                <SelectItem value="gantt">
                  <span className="flex items-center gap-1.5"><GanttChart className="h-3.5 w-3.5" />Gantt</span>
                </SelectItem>
              </SelectContent>
            </Select>
            {onAddEvent && <div className="flex-shrink-0">{onAddEvent}</div>}
          </div>
        </div>

        {/* Row 2: Month navigation centered, full width */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {view === 'monthly' ? (
            <MonthYearPicker
              currentDate={currentDate}
              onDateChange={onDateChange}
              labelClassName="text-sm min-w-[130px] text-center"
            />
          ) : (
            <span className="text-sm font-semibold text-foreground min-w-[130px] text-center">
              {getDateLabel()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Row 3: Project filter, full width */}
        {onProjectFilterChange && projects.length > 0 && (
          <ProjectAutocomplete
            projects={[{ id: 'all', name: 'All Projects', address: '' }, ...projects]}
            value={selectedProjectId || 'all'}
            onSelect={(value) => onProjectFilterChange(value === 'all' ? null : value)}
            placeholder="All Projects"
            triggerClassName="h-9 w-full text-xs bg-card border-border text-foreground hover:bg-secondary"
            className="bg-card border-border"
          />
        )}

        {/* Integrated legend on mobile */}
        <div className="pt-1 border-t border-border">
          <CalendarLegend />
        </div>
      </div>

      {/* ── Desktop layout (existing, unchanged) ── */}
      <div className="hidden sm:flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground whitespace-nowrap">Project Calendar</h1>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {view === 'monthly' ? (
              <MonthYearPicker currentDate={currentDate} onDateChange={onDateChange} />
            ) : (
              <span className="text-base font-semibold text-foreground min-w-[140px] text-center">
                {getDateLabel()}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {onProjectFilterChange && projects.length > 0 && (
            <ProjectAutocomplete
              projects={[{ id: 'all', name: 'All Projects', address: '' }, ...projects]}
              value={selectedProjectId || 'all'}
              onSelect={(value) => onProjectFilterChange(value === 'all' ? null : value)}
              placeholder="All Projects"
              triggerClassName="h-9 w-[220px] bg-card border-border text-foreground hover:bg-secondary"
              className="bg-card border-border"
            />
          )}

          <WeatherWidgetWithCity />

          {/* Desktop pill group */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button
              variant={view === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('monthly')}
              className={view === 'monthly'
                ? 'h-8 bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'h-8 text-muted-foreground hover:text-foreground hover:bg-secondary'}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button
              variant={view === 'gantt' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('gantt')}
              className={view === 'gantt'
                ? 'h-8 bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'h-8 text-muted-foreground hover:text-foreground hover:bg-secondary'}
            >
              <GanttChart className="h-4 w-4 mr-1" />
              Gantt
            </Button>
          </div>
        </div>

        {/* Add Button anchored right */}
        {onAddEvent && <div className="ml-auto flex-shrink-0">{onAddEvent}</div>}
      </div>
    </div>
  );
}
