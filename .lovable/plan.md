
## Fix: Two Exclamation Points on Mobile Task Rows

### Root Cause

In `src/components/project/ProjectTasks.tsx`, the right-side column of each task row renders two elements side by side:

1. `AlertCircle` — the colored priority icon (mobile-only, added in the last change)
2. `getStatusIcon(task.status)` — the status icon (always visible)

When a task has a status like `pending` or `overdue`, `getStatusIcon` also returns an `AlertCircle`-style icon. Combined with the priority icon, this produces two `!` icons on mobile — one right after the other.

### Fix

Wrap the `getStatusIcon` output in a `hidden sm:block` span so it only shows on desktop. On mobile, the colored priority `AlertCircle` alone is sufficient — its color already communicates urgency.

### Change

**File:** `src/components/project/ProjectTasks.tsx` — lines 229–240

```tsx
// Before:
<div className="shrink-0 flex items-center justify-end gap-2 sm:w-[90px]">
  <AlertCircle className={cn("h-4 w-4 sm:hidden", PRIORITY_ICON_COLORS[task.priorityLevel])} />
  <Badge ...>{TASK_PRIORITY_LABELS[task.priorityLevel]}</Badge>
  {getStatusIcon(task.status)}   ← always shown, including on mobile
</div>

// After:
<div className="shrink-0 flex items-center justify-end gap-2 sm:w-[90px]">
  <AlertCircle className={cn("h-4 w-4 sm:hidden", PRIORITY_ICON_COLORS[task.priorityLevel])} />
  <Badge ...>{TASK_PRIORITY_LABELS[task.priorityLevel]}</Badge>
  <span className="hidden sm:block">{getStatusIcon(task.status)}</span>  ← desktop only
</div>
```

**Mobile result:** one colored `!` icon (priority)
**Desktop result:** full badge + status icon (unchanged)

One line change. No logic, no data changes.
