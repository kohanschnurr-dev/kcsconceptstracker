## Goal

Collapse the duplicate stacked Start/End calendars in the Date popover into a single range-picker calendar. The popover currently renders two full calendars when "Multi-day event" is checked, which is excessive — one calendar in `range` mode covers both start and end.

## Change

**File: `src/components/calendar/NewEventModal.tsx`** (lines ~473–502)

Replace the two-calendar block with a single calendar:

- When `isMultiDay` is checked → render one `<Calendar mode="range" />` whose `selected` is `{ from: startDate, to: endDate }`. On select, write `from` to `startDate` (via `handleStartDateChange`) and `to` to `endDate` (falling back to `from` if `to` is undefined).
- When `isMultiDay` is unchecked → keep the existing single-mode calendar (unchanged).

Remove the "Start" / "End" labels and divider since they're no longer needed — the range highlight communicates both ends.

## Why this is safe

- `startDate` / `endDate` state, `handleStartDateChange`, and downstream save logic all stay the same.
- The trigger button label already shows `MMM d – MMM d` for multi-day, so users still see both endpoints.
- Single-day flow is untouched.

## Out of scope

No styling/layout changes elsewhere, no schema changes.
