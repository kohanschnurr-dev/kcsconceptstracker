import { CATEGORY_GROUPS } from '@/lib/calendarCategories';
import { cn } from '@/lib/utils';

interface CalendarLegendProps {
  /** 'gantt' shows Gantt-only chips (Key Event, Project span). 'calendar' hides them. */
  variant?: 'calendar' | 'gantt';
}

export function CalendarLegend({ variant = 'gantt' }: CalendarLegendProps) {
  const isGantt = variant === 'gantt';
  return (
    <div className="flex overflow-x-auto sm:flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-4 text-xs sm:text-sm scrollbar-hide">
      {Object.entries(CATEGORY_GROUPS).map(([key, group]) => (
        <div key={key} className="flex items-center gap-1.5 shrink-0">
          <span className={cn('w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-sm shrink-0', group.swatchClass)} />
          <span className="text-foreground whitespace-nowrap">{group.label}</span>
        </div>
      ))}
      {isGantt && (
        <>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-500 rotate-45 shrink-0" />
            <span className="text-foreground whitespace-nowrap">Key Event</span>
          </div>
        </>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-sm shrink-0 bg-red-500/50 border border-red-500" />
        <span className="text-foreground whitespace-nowrap">Critical Path</span>
      </div>
    </div>
  );
}
