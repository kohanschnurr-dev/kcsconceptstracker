

## Improve the "+X more" Popover Appearance

### Problem
The popover that appears when clicking "+1 more" on a calendar day looks plain and unstyled. The items appear as simple text without the category color styling, and the overall popover lacks visual polish.

### Solution
**File: `src/components/calendar/MonthlyView.tsx`**

Enhance the popover styling to look more polished and consistent with the rest of the calendar:

1. **Widen the popover** from `w-64` to `w-72` so task cards have more breathing room
2. **Style the header** with a bottom border separator and slightly larger text for the date
3. **Add padding and spacing** between task items for better visual separation
4. **Add a subtle background tint** to the popover header area to distinguish it from the list

### Changes (single file)

```tsx
<PopoverContent className="w-72 p-0 overflow-hidden" align="start">
  <div className="px-3 py-2 border-b border-border bg-muted/30">
    <p className="text-xs font-semibold text-foreground">
      {format(day, 'EEEE, MMM d')}
    </p>
    <p className="text-[10px] text-muted-foreground">
      {dayTasks.length} event{dayTasks.length !== 1 ? 's' : ''}
    </p>
  </div>
  <div className="p-2 space-y-1.5 max-h-[240px] overflow-y-auto">
    {dayTasks.map(task => (
      <DealCard key={task.id} task={task} compact onClick={() => onTaskClick(task)} />
    ))}
  </div>
</PopoverContent>
```

Key improvements:
- **Structured header** with full day name (e.g. "Friday, Feb 14") and event count
- **Visual separation** between header and task list via border and muted background
- **Zero padding on wrapper** with internal section padding for a cleaner card-like layout
- **Slightly more max-height** (240px) and spacing between items

