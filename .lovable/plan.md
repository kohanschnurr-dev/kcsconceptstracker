
## Style the Due Date Display in Pipeline Tasks

### What Needs to Change

Looking at the screenshot and the current code in `src/components/project/ProjectTasks.tsx`, the due date (`Feb 18`, `Feb 17`) is currently:
- Colored (orange/amber) and small — blends into the priority badge visually
- No label, just the calendar icon + date
- Crammed into the same `shrink-0` flex group as the priority badge and status icon

The user wants:
1. **Black text** instead of colored text
2. **"Due" prefix** before the date (e.g., "Due Feb 18")
3. **Its own dedicated space** — separated from the badge area so it doesn't feel squished

### The Fix

In `ProjectTasks.tsx`, update the due date `div`:

**Before:**
```tsx
<div className={cn("flex items-center gap-1 text-xs", getDueDateColor(task.dueDate))}>
  <Calendar className="h-3 w-3" />
  <span>{formatDisplayDateShort(task.dueDate)}</span>
</div>
```

**After:**
- Remove the color helper (always dark/black text: `text-foreground`)
- Add "Due " as a prefix label
- Move the due date out of the right-side badge group into a **separate `flex-shrink-0` section** between the title and the badge group, with its own `min-w` so it gets consistent spacing
- Use `text-foreground` (dark/black in this theme) with a slightly muted calendar icon

### Updated Row Layout

```
[ ☐ ] [ Title text ──────────── flex-1 ] [ Due Feb 18 ] [ High ] [ ⓘ ]
         expands                            own column    badge   status
```

The due date block will have:
- `min-w-[80px]` so it always takes a consistent slot regardless of date length
- `text-foreground text-xs font-medium` for black readable text
- Calendar icon in `text-muted-foreground` so the icon is subtle but the text is black
- "Due " as plain text prefix before the date

The `getDueDateColor` function can be removed since color is no longer needed.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/project/ProjectTasks.tsx` | Update due date rendering: black text, "Due" prefix, own spaced column; remove color helper |
