import { CATEGORY_GROUPS } from '@/lib/calendarCategories';
import { cn } from '@/lib/utils';

export function CalendarLegend() {
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-4 text-xs sm:text-sm">
      {Object.entries(CATEGORY_GROUPS).map(([key, group]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={cn('w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm shrink-0', group.bgClass, 'border', group.borderClass)} />
          <span className="text-muted-foreground truncate">{group.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm shrink-0 bg-red-500/50 border border-red-500" />
        <span className="text-muted-foreground">Critical Path</span>
      </div>
    </div>
  );
}
