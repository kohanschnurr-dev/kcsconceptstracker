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
import type { CalendarView } from '@/pages/Calendar';
import { WeatherWidget } from './WeatherWidget';
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
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-card rounded-xl p-4 border border-border">
      {/* Left section: Title + Navigation + Filters + Views */}
      <div className="flex flex-nowrap items-center gap-3 overflow-x-auto">
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
          <span className="text-base font-semibold text-foreground min-w-[140px] text-center">
            {getDateLabel()}
          </span>
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
            triggerClassName="h-9 w-[180px] bg-card border-border text-foreground hover:bg-secondary"
            className="bg-card border-border"
          />
        )}

        <WeatherWidgetWithCity />
      </div>

      {/* Right section: View Toggles + Add Button */}
      <div className="flex items-center gap-2 flex-shrink-0">
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
            Month
          </Button>
          <Button
            variant={view === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('weekly')}
            className={view === 'weekly' 
              ? 'h-8 bg-primary hover:bg-primary/90 text-primary-foreground' 
              : 'h-8 text-muted-foreground hover:text-foreground hover:bg-secondary'}
          >
            <List className="h-4 w-4 mr-1" />
            Week
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
        {onAddEvent && <div>{onAddEvent}</div>}
      </div>
    </div>
  );
}
