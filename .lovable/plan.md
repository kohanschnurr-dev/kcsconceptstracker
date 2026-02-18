
## Hide Due Date & Priority Label on Mobile — Pipeline Tasks

### What to Change

In the task list rows inside `src/components/project/ProjectTasks.tsx`, on mobile:

- **Hide the due date column** (the 105px fixed-width div with the calendar icon + "Due Feb 18" text)
- **Replace the priority Badge** (which shows the text label "High", "Medium", etc.) with a single colored `AlertCircle` icon that inherits the priority's color
- **Keep the status icon** (the small check/clock/alert circle) visible

On desktop (≥ 640px), everything stays exactly as it is now.

### Priority Color Mapping

The `TASK_PRIORITY_COLORS` map uses bg/text/border classes. For the icon, we derive a simple text color per priority:

| Priority | Icon Color |
|---|---|
| `low` | `text-muted-foreground` |
| `medium` | `text-blue-600` |
| `high` | `text-orange-600` |
| `urgent` | `text-red-600` |

### Technical Changes

#### `src/components/project/ProjectTasks.tsx`

**1. Add a priority icon color map** near the existing `TASK_PRIORITY_COLORS` import:

```tsx
const PRIORITY_ICON_COLORS: Record<TaskPriority, string> = {
  low: 'text-muted-foreground',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};
```

**2. Due date column — hide on mobile:**

```tsx
// Before:
<div className="w-[105px] shrink-0 flex items-center justify-end gap-1">

// After:
<div className="hidden sm:flex w-[105px] shrink-0 items-center justify-end gap-1">
```

**3. Priority badge column — show icon on mobile, badge on desktop:**

```tsx
// Before:
<div className="w-[90px] shrink-0 flex items-center justify-end gap-2">
  <Badge variant="secondary" className={cn("text-xs", TASK_PRIORITY_COLORS[task.priorityLevel])}>
    {TASK_PRIORITY_LABELS[task.priorityLevel]}
  </Badge>
  {getStatusIcon(task.status)}
</div>

// After:
<div className="shrink-0 flex items-center justify-end gap-2 sm:w-[90px]">
  {/* Mobile: colored icon only */}
  <AlertCircle className={cn("h-4 w-4 sm:hidden", PRIORITY_ICON_COLORS[task.priorityLevel])} />
  {/* Desktop: full badge */}
  <Badge variant="secondary" className={cn("text-xs hidden sm:inline-flex", TASK_PRIORITY_COLORS[task.priorityLevel])}>
    {TASK_PRIORITY_LABELS[task.priorityLevel]}
  </Badge>
  {getStatusIcon(task.status)}
</div>
```

### Visual Result

**Mobile:**
```
[ ✓ ] Task title text here...          🔴  ⏰
```
*(no due date, no "High"/"Medium" label — just a colored priority icon + status icon)*

**Desktop:**
```
[ ✓ ] Task title text here...   📅 Due Feb 18   [High]  ⏰
```
*(unchanged from current)*

### Files to Modify

| File | Change |
|---|---|
| `src/components/project/ProjectTasks.tsx` | 1. Add `PRIORITY_ICON_COLORS` map. 2. Add `hidden sm:flex` to due date div. 3. Replace Badge with icon on mobile using `sm:hidden` / `hidden sm:inline-flex`. |
