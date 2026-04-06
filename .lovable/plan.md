

## Plan: Clean Up Gantt Chart Visual Clutter

The screenshot shows two UI issues with extra lines:

1. **Day column divider lines in task rows** — Each task row renders vertical `border-l border-border/50` lines for every day column. These thin lines clutter the space around task bars and labels, creating the small lines you see to the right of "Call Surveyor", "Get Business Insurance", etc.

2. **Project header horizontal line** — Each project name row has both a `border-b` on the flex container AND a separate `<div className="flex-1 h-px bg-border" />` stretching to the right, creating a doubled/split line effect across the chart.

### Changes — `src/components/calendar/GanttView.tsx`

**Remove day column dividers from task rows (line 282)**
- Remove `border-l border-border/50` from the day cell dividers inside task rows. Keep only the today highlight (`bg-primary/5`). This eliminates all the tiny vertical lines cluttering the chart body.

**Simplify project header row (lines 238–243)**
- Remove the separate `<div className="flex-1 h-px bg-border" />` element — the `border-b` on the parent flex container already provides the separation line. This eliminates the doubled line / split-line effect.

**Remove outer `space-y-1` gap (line 235)**
- Remove `space-y-1` from the body container so rows sit flush without extra spacing gaps between projects.

### Result
A clean Gantt chart with task bars floating on a minimal grid — no extra vertical lines in task rows, no doubled horizontal lines on project headers.

### Files
- `src/components/calendar/GanttView.tsx`

