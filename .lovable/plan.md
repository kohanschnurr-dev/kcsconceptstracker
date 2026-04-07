

## Subtle "Today" Column Highlight on Gantt View

### Problem
There's no visual indicator for which column represents today in the Gantt chart. The user wants a subtle darker-white background on today's column so it's easy to spot without being distracting.

### Changes

**File: `src/components/calendar/GanttView.tsx`**

Add a subtle vertical background highlight on today's column throughout the entire Gantt body:

1. **Header row** — already highlights today's date text in primary color; no change needed there
2. **Task rows** — add a faint background behind today's column cell. Since the Gantt uses a flex layout with `flex-1` columns, we need to add a background layer per row at today's column position, or overlay a single vertical strip

**Approach**: For each task row's relative container (`flex-1 relative h-7`), render a subtle background div at today's column position. More cleanly, add a full-height "today column" overlay in the chart body using absolute positioning based on `dayIndex / zoomDays` width calculation.

Specifically:
- Compute `todayIndex` from the `days` array using `isToday()`
- In the chart body wrapper (`div` at line 241), add `position: relative` and render an absolutely-positioned vertical stripe at `left: (todayIndex / zoomDays * 100)%` with `width: (1/zoomDays * 100)%`
- Style: `bg-foreground/[0.03]` (very subtle darkening — sleek hint, not overbearing)
- Account for the 48-unit (w-48) left label column offset by placing the overlay inside the flex-1 area

### Files
- `src/components/calendar/GanttView.tsx` — add today column overlay

