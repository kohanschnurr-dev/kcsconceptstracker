## Goal

In the **Month** and **Week** calendar views (the non-Gantt views), surface two visual elements that today only exist in the Gantt view but are advertised in the legend:

1. **Diamond milestone marker** — events whose category group is `milestones` (or that are zero-duration) should render as a small rotated-square (diamond) chip instead of a flat pill, matching the Gantt style.
2. **Project span bar** — for any project that has events on the visible day, render a thin chevron-style bar at the top of each day cell showing the project's overall start→end span (the same "summary chevron" the Gantt uses).

This makes the legend's "Milestone" and "Project span" entries actually meaningful in Month/Week views.

## Current State

- `src/components/calendar/MonthlyView.tsx` and `WeeklyView.tsx` render every event with `<DealCard compact />` — a flat pill. Milestones look identical to multi-day work.
- `src/components/calendar/GanttView.tsx` has the canonical milestone + project-span styles (lines ~530-555 and ~459-475 respectively).
- `isMilestone(t)` logic from Gantt: zero-day duration OR `getCategoryGroup(eventCategory) === 'milestones'`.

## Changes

### 1. Milestone diamond in `DealCard`

Extend `DealCard.tsx`:
- Add an `isMilestone` helper (same logic as Gantt).
- When `compact && isMilestone(task)`, render a centered diamond chip (14×14 rotated 45°, category color background, optional ring for critical path) with the title to the right on a single line. Falls back to current pill style otherwise.
- Keep `onClick` and drag handles intact so reschedule still works.

### 2. Project span chevron in Month/Week day cells

In both `MonthlyView.tsx` and `WeeklyView.tsx`:
- Group `dayTasks` by `projectId` for the cell.
- For each project present, compute the project's overall date range (across the full `tasks` prop, not just this day).
- If that range covers more than one day **and** today's day is within it, render a 4px-tall chevron strip above the event list, color-tinted by the project's first event's category group, with a subtle label tooltip on hover (`Project: {projectName} • {start} → {end}`).
- Skip rendering if the project has only single-day events (no real "span" to show).

Optional polish: only show the chevron once per project per week row to avoid visual repetition — start with the simpler per-day version and we can iterate.

### 3. Legend already covers it

`CalendarLegend.tsx` already lists Milestone (diamond) and Project span — no change needed there.

## Files Touched

- `src/components/calendar/DealCard.tsx` — add milestone diamond render branch
- `src/components/calendar/MonthlyView.tsx` — add per-day project-span chevron strip
- `src/components/calendar/WeeklyView.tsx` — same chevron strip

## Notes

- Reuses `getCategoryGroup` from `@/lib/calendarCategories` so colors stay aligned with the legend.
- No DB or schema work needed.
- Drag-to-reschedule keeps working because we only change visual presentation; the draggable wrapper stays around the chip.
