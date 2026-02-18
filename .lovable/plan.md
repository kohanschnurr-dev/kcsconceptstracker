
## Fix Due Date Alignment in Pipeline Tasks

### The Problem

From the screenshot, two issues are visible:
1. The due date appears **far right**, crowded next to the priority badge
2. Rows with and without due dates are **misaligned** — the badge jumps left when there's no date

The root cause: the due date `div` uses `min-w-[85px]` but only renders *when there's a date*. Tasks without a date skip it entirely, so the badge column is in a different position per row.

### The Fix

**Give the due date a fixed-width column that always renders** — even when empty. This creates a consistent grid-like layout where every row has the same column structure:

```
[ ☐ ] [ Title ── flex-1 ] [ Due Feb 18  ] [ High ] [ ⓘ ]
[ ☐ ] [ Title ── flex-1 ] [             ] [ High ] [ ⓘ ]
                            ↑ always 100px wide
```

**Key changes in `src/components/project/ProjectTasks.tsx`:**

1. Move the due date `div` **outside** the conditional — always render the wrapper, just conditionally show content inside:
   ```tsx
   <div className="w-[100px] shrink-0 flex items-center gap-1">
     {task.dueDate && (
       <>
         <Calendar className="h-3 w-3 text-muted-foreground" />
         <span className="text-xs text-foreground font-medium">Due {formatDisplayDateShort(task.dueDate)}</span>
       </>
     )}
   </div>
   ```

2. Change from `min-w-[85px]` to `w-[100px]` — fixed width, not minimum, so it always takes exactly that space.

3. The badge group stays `shrink-0` on the far right, but now it's always at the same position because the due date column is always present.

### Final Row Layout

```
[ ☐ ] [ Title text ─── flex-1 truncate ] [  Due Feb 18  ] [ High ] [ ⓘ ]
[ ☐ ] [ Another title ─ flex-1 truncate ] [              ] [ High ] [ ⓘ ]
       ^title fills all available space    ^always 100px   ^fixed right
```

### Files to Modify

| File | Change |
|------|--------|
| `src/components/project/ProjectTasks.tsx` | Always render a fixed `w-[100px]` due date column; only show content inside when `dueDate` exists |
