import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, GanttChart, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import type { CalendarView } from '@/pages/Calendar';
import { WeatherWidget } from './WeatherWidget';

interface CalendarHeaderProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarHeader({ view, onViewChange, currentDate, onDateChange }: CalendarHeaderProps) {
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

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-emerald-500" />
          <h1 className="text-xl font-bold text-white">Project Calendar</h1>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-8 px-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <span className="text-lg font-semibold text-white hidden sm:block">
          {getDateLabel()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <WeatherWidget />
        
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          <Button
            variant={view === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('monthly')}
            className={view === 'monthly' 
              ? 'h-8 bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'h-8 text-slate-400 hover:text-white hover:bg-slate-700'}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Month
          </Button>
          <Button
            variant={view === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('weekly')}
            className={view === 'weekly' 
              ? 'h-8 bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'h-8 text-slate-400 hover:text-white hover:bg-slate-700'}
          >
            <List className="h-4 w-4 mr-1" />
            Week
          </Button>
          <Button
            variant={view === 'gantt' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('gantt')}
            className={view === 'gantt' 
              ? 'h-8 bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'h-8 text-slate-400 hover:text-white hover:bg-slate-700'}
          >
            <GanttChart className="h-4 w-4 mr-1" />
            Gantt
          </Button>
        </div>
      </div>
    </div>
  );
}
