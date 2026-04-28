## Goal

The Gantt's visible window starts at `startOfWeek(currentDate)` and extends `zoomDays` forward, so today is always at the far left and any event before today is off-screen with no way to scroll back. Shift the window so today sits ~1/4 from the left edge, leaving room to see past events while still keeping today prominent and visible.

## Change

**File: `src/components/calendar/GanttView.tsx`** (line 115)

Replace:
```ts
const viewStart = startOfWeek(currentDate);
```
with:
```ts
const lookbackDays = Math.max(7, Math.floor(zoomDays * 0.25));
const viewStart = startOfWeek(addDays(currentDate, -lookbackDays));
```

This places ~25% of the visible window before today (minimum one week), and ~75% after — so users see recent past events alongside upcoming ones. The existing `<` `>` arrows in `CalendarHeader` continue to page further in either direction.

## Why

- "Starts at the current date" preserved in spirit — today remains visible and the red "today" line is on screen.
- Past events (e.g., Apr 26-27 diamonds in the user's screenshot when today is Apr 28) become reachable without paging.
- Scales with zoom: a 90-day window shows ~22 days back / ~68 forward, a 14-day window shows ~7 back / ~7 forward.

## Out of scope

No changes to navigation arrows, default zoom, or task data.
