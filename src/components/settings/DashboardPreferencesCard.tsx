import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart3, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { triggerSettingsSync } from '@/hooks/useSettingsSync';
import { parseDateString, formatDateString } from '@/lib/dateUtils';
import type { TimelinePreset } from '@/lib/timelineFilter';

const STORAGE_KEY = 'dashboard-profit-filters';

interface ProfitFilters {
  types: string[];
  statuses: string[];
  timeline: TimelinePreset;
  timelineStart?: string;
  timelineEnd?: string;
}

const DEFAULT_FILTERS: ProfitFilters = {
  types: ['fix_flip', 'rental', 'new_construction', 'wholesaling', 'contractor'],
  statuses: ['active'],
  timeline: 'all',
};

const PROJECT_TYPES = [
  { value: 'fix_flip', label: 'Fix & Flip' },
  { value: 'wholesaling', label: 'Wholesaling' },
  { value: 'rental', label: 'Rental' },
  { value: 'new_construction', label: 'New Construction' },
  { value: 'contractor', label: 'Contractor' },
];

const PROJECT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Completed' },
];

const TIMELINE_OPTIONS: { value: TimelinePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'this_year', label: 'This Year' },
  { value: '6_months', label: 'Last 6 Months' },
  { value: '12_months', label: 'Last 12 Months' },
  { value: 'custom', label: 'Custom Range' },
];

function loadFilters(): ProfitFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FILTERS, ...parsed };
    }
  } catch {}
  return DEFAULT_FILTERS;
}

export default function DashboardPreferencesCard() {
  const [filters, setFilters] = useState<ProfitFilters>(loadFilters);

  useEffect(() => {
    const handleSync = () => setFilters(loadFilters());
    window.addEventListener('settings-synced', handleSync);
    return () => window.removeEventListener('settings-synced', handleSync);
  }, []);

  const save = (next: ProfitFilters) => {
    setFilters(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    triggerSettingsSync();
  };

  const toggleType = (value: string) => {
    const types = filters.types.includes(value)
      ? filters.types.filter(t => t !== value)
      : [...filters.types, value];
    save({ ...filters, types });
  };

  const toggleStatus = (value: string) => {
    const statuses = filters.statuses.includes(value)
      ? filters.statuses.filter(s => s !== value)
      : [...filters.statuses, value];
    save({ ...filters, statuses });
  };

  const setTimeline = (value: TimelinePreset) => {
    save({ ...filters, timeline: value });
  };

  const setCustomStart = (date: Date | undefined) => {
    save({ ...filters, timelineStart: date ? formatDateString(date) : undefined });
  };

  const setCustomEnd = (date: Date | undefined) => {
    save({ ...filters, timelineEnd: date ? formatDateString(date) : undefined });
  };

  const customStartDate = filters.timelineStart ? parseDateString(filters.timelineStart) : undefined;
  const customEndDate = filters.timelineEnd ? parseDateString(filters.timelineEnd) : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Dashboard Preferences
        </CardTitle>
        <CardDescription>Configure which projects appear in your dashboard profit stats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Profit Potential – Project Types</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PROJECT_TYPES.map(t => (
              <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.types.includes(t.value)}
                  onCheckedChange={() => toggleType(t.value)}
                />
                <span className="text-sm">{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Profit Potential – Status</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PROJECT_STATUSES.map(s => (
              <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.statuses.includes(s.value)}
                  onCheckedChange={() => toggleStatus(s.value)}
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Timeline</Label>
          <RadioGroup
            value={filters.timeline}
            onValueChange={(v) => setTimeline(v as TimelinePreset)}
            className="grid grid-cols-2 gap-2 mt-2"
          >
            {TIMELINE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value={opt.value} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>

          {filters.timeline === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs", !customStartDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {customStartDate ? format(customStartDate, 'MMM d, yyyy') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStart}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs", !customEndDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {customEndDate ? format(customEndDate, 'MMM d, yyyy') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEnd}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
