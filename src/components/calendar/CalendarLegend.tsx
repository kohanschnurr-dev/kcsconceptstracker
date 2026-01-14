import { CATEGORY_GROUPS } from '@/lib/calendarCategories';
import { cn } from '@/lib/utils';

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {Object.entries(CATEGORY_GROUPS).map(([key, group]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={cn('w-3 h-3 rounded-sm', group.bgClass, 'border', group.borderClass)} />
          <span className="text-slate-400">{group.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-700">
        <span className="w-3 h-3 rounded-sm bg-red-500/50 border border-red-500" />
        <span className="text-slate-400">Critical Path</span>
      </div>
    </div>
  );
}
