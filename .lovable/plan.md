## Goal
Hide the "Key Event" diamond and "Project span" arrow legend chips when the user is in **Calendar** view — they're only meaningful in the Gantt view. The "Critical Path" chip stays in both.

## Changes

### `src/components/calendar/CalendarLegend.tsx`
Add an optional `variant?: 'calendar' | 'gantt'` prop (default `'gantt'`). When `variant === 'calendar'`, skip rendering the Key Event and Project span chips. Category swatches and Critical Path remain.

### Pass the active view to the legend
- **`src/components/calendar/CalendarHeader.tsx`** (line 152): pass `variant={view === 'gantt' ? 'gantt' : 'calendar'}` to `<CalendarLegend />`. Header already knows `view`.
- **`src/pages/Calendar.tsx`** (line 332): same — pass `variant` based on the page's `view` state.
- **`src/components/project/ProjectCalendar.tsx`** (line 465): pass `variant` based on whichever view state that component holds (will inspect in implementation; if it has no Gantt view, hard-code `'calendar'`).

No other behavior changes. No DB, no new files.
