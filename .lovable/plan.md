# Fix duplicate calendar legend

## Problem
Two legends render on `/calendar` when Gantt view is active:
1. **Inline legend inside `GanttView.tsx`** (lines 573–604) — has truncated labels ("Structural/Exterior" overlaps the next swatch, "Rough-ins" runs into "Inspections") because it uses tight `gap-x-5` with no `whitespace-nowrap` and no overflow handling.
2. **Shared `CalendarLegend` component** rendered from `Calendar.tsx` line 318 — already handles wrapping/nowrap correctly and is shown for all views.

Result: the user sees a cramped, unreadable strip directly on top of a clean, readable one.

## Plan

### 1. `src/components/calendar/GanttView.tsx`
Remove the entire inline legend block (lines 573–604), including the category swatches, Milestone diamond, Project span chevron, and the dependency-arrow legend on the right.

The dependency arrow legend (FS/SS/FF/SF) is rarely needed visually — arrows in the chart are self-explanatory in context. Removing it keeps the bottom area clean. (If you'd rather keep just the dependency-arrow swatches, say the word and I'll preserve only that piece.)

### 2. `src/components/calendar/CalendarLegend.tsx`
Add the two markers that previously only existed in the Gantt legend so they remain available in the shared legend:
- **Milestone** — small amber diamond (`w-3 h-3 bg-amber-500 rotate-45`)
- **Project span** — chevron strip using the existing inline `clipPath` style

Both items get `whitespace-nowrap` (already present on existing items) and `shrink-0` so labels never get clipped or overlapped on narrow widths. They appear after the existing categories and before "Critical Path".

### 3. No other files need changes
`Calendar.tsx` already renders `<CalendarLegend />` once for all views, so removing the Gantt-internal copy leaves exactly one legend visible at all times.

## Result
- One legend on the page, regardless of view (Monthly / Weekly / Gantt).
- All labels fully readable, with consistent spacing and the same swatch styling already used on the rest of the calendar page.
