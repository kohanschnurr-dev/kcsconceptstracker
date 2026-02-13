import { startOfYear, subMonths } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';

export type TimelinePreset = 'all' | 'this_year' | '6_months' | '12_months' | 'custom';

export interface TimelineRange {
  start: Date | null;
  end: Date | null;
}

export function resolveTimeline(
  timeline: TimelinePreset,
  customStart?: string,
  customEnd?: string,
): TimelineRange {
  const now = new Date();
  switch (timeline) {
    case 'this_year':
      return { start: startOfYear(now), end: now };
    case '6_months':
      return { start: subMonths(now, 6), end: now };
    case '12_months':
      return { start: subMonths(now, 12), end: now };
    case 'custom':
      return {
        start: customStart ? parseDateString(customStart) : null,
        end: customEnd ? parseDateString(customEnd) : null,
      };
    default:
      return { start: null, end: null };
  }
}

export function isDateInRange(dateStr: string | undefined, range: TimelineRange): boolean {
  if (!range.start && !range.end) return true;
  if (!dateStr) return true;
  const d = parseDateString(dateStr);
  if (range.start && d < range.start) return false;
  if (range.end && d > range.end) return false;
  return true;
}
