
## Always Show Today's Agenda Banner

### Problem
When there are no tasks, overdue items, or calendar events, the `TasksDueTodayBanner` component returns `null` and disappears entirely, leaving a confusing gap in the dashboard layout.

### Fix

**`src/components/dashboard/TasksDueTodayBanner.tsx`**

Remove the early return on line that checks `if (totalActionable === 0) return null;`. The banner will always render, showing the 3-column grid with "View Calendar", "View Tasks", and "View Events" buttons even when counts are zero. The badge will show "0 Items" and the buttons will display their default labels ("View Calendar", "View Tasks", "View Events").

### Files to Change
- **`src/components/dashboard/TasksDueTodayBanner.tsx`** -- remove the `totalActionable === 0` early return so the banner always renders
