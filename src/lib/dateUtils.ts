/**
 * Date utilities that parse date strings as LOCAL time (not UTC)
 * Fixes the timezone offset issue where "2026-01-16" becomes Jan 15 in CST
 */

/**
 * Parse a YYYY-MM-DD date string as local date (not UTC)
 * Use this instead of new Date(dateStr) or parseISO(dateStr)
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date to YYYY-MM-DD string using local components
 * Use this instead of toISOString().split('T')[0]
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string for display (e.g., "Jan 16, 2026")
 * Handles the timezone offset correctly
 */
export function formatDisplayDate(
  dateStr: string, 
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string with weekday (e.g., "Mon, Jan 16, 2026")
 */
export function formatDisplayDateWithWeekday(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string in long format (e.g., "Wednesday, January 16, 2026")
 */
export function formatDisplayDateLong(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string for short display (e.g., "Jan 16")
 */
export function formatDisplayDateShort(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to MM/DD/YYYY format
 */
export function formatDisplayDateNumeric(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
