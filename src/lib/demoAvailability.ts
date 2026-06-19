// Generates available demo slots in America/Chicago business hours,
// converted to UTC ISO timestamps for storage and comparison.

const BUSINESS_TZ = "America/Chicago";
const SLOT_MINUTES = 30;
export const DAYS_AHEAD = 14;

/** Returns [startMinutes, endMinutes) windows for a given day-of-week (0=Sun..6=Sat). */
function windowsForDow(dow: number): Array<[number, number]> {
  // Sat (6) or Sun (0): 9:00 AM – 9:00 PM CT
  if (dow === 0 || dow === 6) {
    return [[9 * 60, 21 * 60]];
  }
  // Mon–Fri: 7:00–8:00 AM and 5:30–9:00 PM CT
  return [
    [7 * 60, 8 * 60],
    [17 * 60 + 30, 21 * 60],
  ];
}

/** Server-safe check: does this CT wall time fall inside an allowed window? */
export function isAllowedCtWallTime(dow: number, hour: number, minute: number): boolean {
  const m = hour * 60 + minute;
  return windowsForDow(dow).some(([s, e]) => m >= s && m < e);
}

/**
 * Returns a Date that represents `year/month/day at hh:mm` in BUSINESS_TZ
 * (CT), but produced as a UTC instant. We do this by computing the UTC
 * offset for CT at that moment and shifting accordingly.
 */
function ctWallClockToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  // Build a "naive" UTC date with those wall-clock fields...
  const asIfUtc = Date.UTC(year, month, day, hour, minute, 0, 0);
  // ...then ask the formatter what CT thinks that UTC moment is.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(asIfUtc));
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  const ctAsUtc = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
  const offset = asIfUtc - ctAsUtc; // ms to add to asIfUtc to get the true UTC for that CT wall time
  return new Date(asIfUtc + offset);
}

export interface DayOption {
  iso: string;           // YYYY-MM-DD (in CT)
  date: Date;            // midnight CT as a UTC Date — used purely as a key/label
  label: string;         // "Mon"
  dateLabel: string;     // "Apr 8"
  disabled: boolean;     // weekends/past
}

export function getNextDays(now: Date = new Date()): DayOption[] {
  const days: DayOption[] = [];
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  // Start from today in CT
  const todayParts = dtf.formatToParts(now).reduce<Record<string, string>>((a, p) => {
    a[p.type] = p.value; return a;
  }, {});
  const startY = +todayParts.year;
  const startM = +todayParts.month - 1;
  const startD = +todayParts.day;

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const probe = new Date(Date.UTC(startY, startM, startD + i, 12, 0, 0));
    const parts = dtf.formatToParts(probe).reduce<Record<string, string>>((a, p) => { a[p.type] = p.value; return a; }, {});
    const y = +parts.year, mo = +parts.month - 1, d = +parts.day;
    const dayDate = new Date(Date.UTC(y, mo, d, 12, 0, 0));
    const dow = new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TZ, weekday: "short" }).format(dayDate);
    const isWeekend = dow === "Sat" || dow === "Sun";
    days.push({
      iso: `${parts.year}-${parts.month}-${parts.day}`,
      date: dayDate,
      label: dow,
      dateLabel: new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TZ, month: "short", day: "numeric" }).format(dayDate),
      disabled: false,
    });
  }
  return days;
}

export interface Slot {
  utc: Date;     // exact UTC instant
  iso: string;   // utc.toISOString()
  label: string; // in the prospect's timezone (or CT)
}

/** All slots for a given CT day (returns even past slots — caller filters). */
export function getSlotsForDay(dayIso: string, displayTz: string): Slot[] {
  const [y, m, d] = dayIso.split("-").map(Number);
  // Determine CT day-of-week for this date (use noon to avoid DST edges).
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dowName = new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TZ, weekday: "short" }).format(probe);
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = dowMap[dowName] ?? 1;
  const windows = windowsForDow(dow);
  const slots: Slot[] = [];
  for (const [startMin, endMin] of windows) {
    for (let mins = startMin; mins < endMin; mins += SLOT_MINUTES) {
      const h = Math.floor(mins / 60);
      const min = mins % 60;
      const utc = ctWallClockToUtc(y, m - 1, d, h, min);
      slots.push({
        utc,
        iso: utc.toISOString(),
        label: new Intl.DateTimeFormat("en-US", {
          timeZone: displayTz,
          hour: "numeric",
          minute: "2-digit",
        }).format(utc),
      });
    }
  }
  return slots;
}


export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
