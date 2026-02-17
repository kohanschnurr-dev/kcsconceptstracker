import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface MonthYearPickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
  labelClassName?: string;
  formatStr?: string;
}

export function MonthYearPicker({
  currentDate,
  onDateChange,
  className,
  labelClassName,
  formatStr = 'MMMM yyyy',
}: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  const [mode, setMode] = useState<'month' | 'year'>('month');

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setViewYear(currentDate.getFullYear());
      setMode('month');
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    onDateChange(new Date(viewYear, monthIndex, 1));
    setOpen(false);
  };

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setMode('month');
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Year grid: show 12 years centered around viewYear
  const yearStart = viewYear - 5;
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'text-base font-semibold text-foreground min-w-[140px] text-center cursor-pointer rounded-md px-2 py-1 hover:bg-secondary transition-colors',
            labelClassName
          )}
        >
          {format(currentDate, formatStr)}
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[280px] p-3', className)} align="center">
        {mode === 'month' ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewYear(y => y - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button
                onClick={() => setMode('year')}
                className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
              >
                {viewYear}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewYear(y => y + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((month, i) => {
                const isSelected = i === currentMonth && viewYear === currentYear;
                const isCurrentMonth = i === new Date().getMonth() && viewYear === new Date().getFullYear();
                return (
                  <Button
                    key={month}
                    variant={isSelected ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-9 text-sm',
                      isSelected && 'bg-primary text-primary-foreground',
                      !isSelected && isCurrentMonth && 'border border-primary/40 text-primary',
                    )}
                    onClick={() => handleMonthSelect(i)}
                  >
                    {month}
                  </Button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewYear(y => y - 12)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">
                {yearStart} – {yearStart + 11}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewYear(y => y + 12)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {years.map(year => {
                const isSelected = year === currentYear;
                const isCurrent = year === new Date().getFullYear();
                return (
                  <Button
                    key={year}
                    variant={isSelected ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-9 text-sm',
                      isSelected && 'bg-primary text-primary-foreground',
                      !isSelected && isCurrent && 'border border-primary/40 text-primary',
                    )}
                    onClick={() => handleYearSelect(year)}
                  >
                    {year}
                  </Button>
                );
              })}
            </div>
          </>
        )}
        <div className="mt-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => {
              onDateChange(new Date());
              setOpen(false);
            }}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
