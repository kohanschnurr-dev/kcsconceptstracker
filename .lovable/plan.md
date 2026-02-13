

## Move Status Text Into the Buttons

### Problem
The "2 overdue" and "4 events" text floats as separate lines above the buttons, creating visual clutter. The user wants these counts embedded directly into the button labels.

### Changes
**File: `src/components/dashboard/TasksDueTodayBanner.tsx`**

**Middle Box (Tasks)** -- Remove the floating text div entirely. Build the button label dynamically:
- If overdue > 0: button says "View Tasks (2 overdue)" with the count in destructive color
- If only due today: button says "View Tasks (1 due today)"  
- If neither: button says "View Tasks"

**Right Box (Events)** -- Same approach. Remove the floating text div:
- If events > 0: button says "View 4 Events"
- If no events: button says "View Events"

**Left Box (Calendar)** -- No change needed, it's already clean.

### Technical Details

**Middle box (lines 173-199)**: Remove lines 176-190 (the `flex-1` content div with status text). Replace the button content with:
```tsx
<Button ...>
  {overdueCount > 0
    ? `${overdueCount} Overdue`
    : tasksDueToday.length > 0
    ? `${tasksDueToday.length} Due Today`
    : 'View Tasks'}
</Button>
```
The button text color will change based on status: destructive styling for overdue, warning for due today, default primary for no tasks. Add `flex-1` spacer div before the button to keep it anchored at the bottom.

**Right box (lines 201-221)**: Remove lines 204-212 (the `flex-1` content div with event count). Replace the button content with:
```tsx
<Button ...>
  {todayEvents.length > 0
    ? `View ${todayEvents.length} Event${todayEvents.length !== 1 ? 's' : ''}`
    : 'View Events'}
</Button>
```
Add `flex-1` spacer div before the button.

This eliminates all floating text, making each box just: icon at top, button at bottom with the count baked into the label.
