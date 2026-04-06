

## Plan: Fix Grey Blocks in Gantt Chart

The grey rectangular blocks visible in task rows when zoomed out are caused by the background day-cell grid (lines 282–292). Each task row renders a full set of `flex-1` day divider `<div>` elements behind the task bar. When columns are narrow at wider zoom levels, these empty flex children can produce visible grey artifacts due to sub-pixel rendering and flex layout boundaries.

### Fix — `src/components/calendar/GanttView.tsx`

**Remove the background day-cell grid from task rows (lines 282–293)**
- Delete the entire `<div className="absolute inset-0 flex">` block containing the day-cell loop inside task rows
- Replace with a single today-highlight element: if any day is today, render one positioned `<div>` at the correct percentage offset with `bg-primary/5`, calculated the same way as task positions
- This eliminates all the empty flex children that create the grey artifacts while preserving the today column highlight

### Result
Clean task rows with only the colored task bars — no phantom grey rectangles at any zoom level.

### Files
- `src/components/calendar/GanttView.tsx`

