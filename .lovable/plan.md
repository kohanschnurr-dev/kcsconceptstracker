# Collapse repeating tasks into single Gantt rows

## Problem
In Gantt view, every event is rendered on its own row. A property with 12 monthly "Collect Rent" tasks produces 12 stacked rows that all look identical, making the timeline noisy and unreadable.

## Decisions (confirmed)
- **Group by:** same project + same title (case-insensitive, trimmed). All other categories/recurrence settings ignored.
- **Row label:** title only — no count badge.
- **Click behavior:** each bar on the row remains an independent clickable/draggable event (no expand toggle, no series panel).

## Changes — `src/components/calendar/GanttView.tsx`

### 1. New memo `mergedTasksByProject`
After the existing `groupedTasks` memo, build a per-project list of "rows", where each row is `{ key, representative: CalendarTask, instances: CalendarTask[] }`. Tasks with the same normalized title within a project collapse into one row. Instances inside a row are sorted by `startDate`.

### 2. Update `rowYMap`
Walk `mergedTasksByProject` instead of `groupedTasks`. Every instance in a row maps to the same Y center (the row's center), so dependency arrows still resolve correctly even when the predecessor and successor land on the same merged row or on different merged rows.

### 3. Update `totalBodyH`
Compute height from merged row counts: `ROW_H + (collapsed ? 0 : rows.length * ROW_H)` per project.

### 4. Refactor the row render loop (lines ~422–558)
Replace `projectTasks.map(task => …)` with `rows.map(row => …)`:

- **Frozen left cell** — render once per row, using `row.representative`:
  - Icon from `categoryIcon(representative.eventCategory)`
  - Title text = `representative.title`
  - Click on the title still calls `onTaskClick(representative)` (opens the first instance; consistent with "click each bar individually" — clicking the row label is just a convenience entry to one event, the bars are the source of truth).
  - Dependency-warning icon shows if **any** instance in the row has a warning.

- **Timeline cell** — loop over `row.instances` and render one bar/diamond per instance using the existing bar/diamond JSX. Each bar:
  - Uses its own `getPos(instance)` for left/width
  - Uses its own color via `barBg(instance)` (instances of the same title will normally have the same category, so colors will match)
  - Keeps its own `onClick={() => onTaskClick(instance)}`, drag handlers, tooltip with that instance's dates, completed/critical-path styling
  - Keyed by `instance.id`

- The shared row container keeps `height: ROW_H` so all bars stack on the same line.

### 5. Collapse animation
Update the collapsible wrapper's `maxHeight` to `rows.length * (ROW_H + 1) + 4`.

### 6. `summaryPos` stays as-is
The project summary chevron at the top of each project group is computed from the full task list (`projectTasks`), unchanged — it still shows the project span correctly.

## Edge cases handled
- **Empty / missing title** — falls back to `t.id` as the bucket key so untitled tasks don't all merge into one row.
- **Overlapping bars on the same row** — rare for true recurring tasks (rent on the 1st of each month doesn't overlap), and the existing `z-10` + hover ring on bars makes individually-clicking them workable. No special spacing needed.
- **Dependency arrows targeting a merged-instance** — the arrow now points at the row's shared Y line; the X coordinate still uses the specific predecessor/successor instance's position, so the arrow lands on the correct bar.
- **Drag-to-move** — each bar still drags its own instance only; the row is not draggable as a whole.

## Result
"Collect Rent" appearing 12 times in N Hall St becomes one row labeled "Collect Rent" with 12 small bars distributed across the timeline — exactly like a calendar swimlane. Each bar is still individually clickable, draggable, and shows its own date in the tooltip.
