## Goal

Clean up the Gantt view by removing the "Project span" chevron bar and widening the frozen left column so project titles like "2808 Old N…" are no longer cut off.

## Changes

### 1. Remove "Project span" chevron bar (`src/components/calendar/GanttView.tsx`)
- Remove the summary chevron bar rendered at lines ~562–579 (the gray polygon-clipped bar shown next to the project name row).
- Remove the now-unused `summaryPos` helper (line 335) and the `sp` variable at the call site (~line 495).
- Keep the project name row container itself — only the gray chevron disappears, so collapsed/expanded chevron toggle behavior is unaffected.

### 2. Remove "Project span" legend chip (`src/components/calendar/CalendarLegend.tsx`)
- Delete the legend entry that renders the gray chevron + "Project span" label (lines ~25–35). Keep "Key Event" and "Critical Path".

### 3. Widen the frozen project/task label column (`src/components/calendar/GanttView.tsx`)
- Increase `FROZEN_W` from `192` (w-48) to `256` (w-64). This gives ~64px more room so names like "2808 Old Northern Pkwy" and "534 St John's…" fully fit on the current 1812px viewport while still leaving plenty of timeline space.
- The header label, project rows, and task rows all read from `FROZEN_W`, so this single constant change widens every row's left section consistently.
- The existing `truncate` class stays as a safety net for extremely long names, but standard project titles will now display in full.

## Out of Scope
- No changes to colors, category groups, Gantt row heights, zoom behavior, or task bars.
- No data/schema changes.
