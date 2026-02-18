
## Simplify Mobile Calendar: Replace Event Boxes with "X tasks" Badge

### What the User Wants

On mobile, the calendar cells are tiny (roughly 43px wide each in 7 columns). Showing multiple colored `DealCard` boxes inside each cell makes them unreadable and visually cluttered. The user wants to:

- **Remove** the colored event boxes from inside the day cells on mobile
- **Replace** them with a simple clickable badge like "3 tasks" (or "1 task") that opens the task detail view

On desktop (`sm:` and up), the current colored card layout stays as-is.

### Solution

The change is entirely within `src/components/project/ProjectCalendar.tsx`. No other files need to change.

#### On mobile (default, below `sm:` breakpoint):
- Hide the `DealCard` components entirely
- Show a single compact badge below the date number: `"2 tasks"` if there are tasks, nothing if the day is empty
- Tapping the badge (or anywhere on the cell) opens the `TaskDetailPanel` with the first task, OR shows an inline expanded list via the existing `expandedDay` state

#### Better UX approach:
Instead of opening just one task, tapping "X tasks" on a day should open a **bottom sheet / popover** listing all tasks for that day so the user can pick which to open — similar to what the desktop `MonthlyView` already does with a `Popover`.

We already have `Popover` from Radix UI in the project. We can use the same popover pattern from `MonthlyView.tsx` for the mobile "X tasks" tap:

```tsx
// Mobile cell — just show a compact badge
<div className="sm:hidden">
  {dayTasks.length > 0 && (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-[9px] font-medium text-primary/80 hover:text-primary w-full text-center leading-tight mt-0.5 rounded hover:bg-primary/10 px-0.5 py-0.5 transition-colors">
          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 overflow-hidden z-50" align="center">
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold">{format(day, 'EEEE, MMM d')}</p>
          <p className="text-[10px] text-muted-foreground">{dayTasks.length} event{dayTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-2 space-y-1.5 max-h-[240px] overflow-y-auto">
          {dayTasks.map(task => (
            <DealCard key={task.id} task={task} compact onClick={() => {
              setSelectedTask(task);
              setPanelOpen(true);
            }} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )}
</div>

// Desktop — existing DealCard layout (unchanged)
<div className="hidden sm:block space-y-0.5">
  {visibleTasks.map(task => (
    <DealCard ... />
  ))}
  {hasMore && !isExpanded && ...}
</div>
```

### Files to Modify

| File | Change |
|---|---|
| `src/components/project/ProjectCalendar.tsx` | Import `Popover`, `PopoverTrigger`, `PopoverContent`. Replace the day cell event rendering with: mobile shows "X tasks" badge → Popover; desktop (`sm:block`) shows the existing `DealCard` list. |

### What stays the same
- Desktop layout: colored DealCard boxes per cell, exactly as before
- Legend, header, swipe navigation — untouched
- `TaskDetailPanel` opened when a task is selected from the popover list

### Visual Before/After (Mobile)

**Before:**
```
┌─────┐
│  3  │
│[███]│  ← colored boxes stacked, unreadable
│[███]│
│[███]│
│ +2  │
└─────┘
```

**After:**
```
┌─────┐
│  3  │
│3    │  ← "3 tasks" small text badge → tap → popover list
│tasks│
└─────┘
```

Clean, readable, tappable — tapping opens a popover showing all tasks for that day with full DealCard detail, then tapping a task opens the TaskDetailPanel.
