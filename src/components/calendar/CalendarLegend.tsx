import { CATEGORY_GROUPS } from '@/lib/calendarCategories';
import { cn } from '@/lib/utils';

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {Object.entries(CATEGORY_GROUPS).map(([key, group]) => (
        <div key={key} className="flex items-center gap-2">
          <span className={cn('w-3.5 h-3.5 rounded-sm', group.bgClass, 'border', group.borderClass)} />
          <span className="text-muted-foreground">{group.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
        <span className="w-3.5 h-3.5 rounded-sm bg-red-500/50 border border-red-500" />
        <span className="text-muted-foreground">Critical Path</span>
      </div>
    </div>
  );
}
