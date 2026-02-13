
## Make "+X more" Clickable to Reveal Hidden Tasks

### Problem
When a calendar day has more than 3 tasks, the overflow shows "+1 more" (or "+X more") as plain text with no way to see the hidden tasks.

### Solution
Make the "+X more" text a clickable button that opens a popover showing all tasks for that day. This is the standard pattern used by Google Calendar and similar apps.

**File: `src/components/calendar/MonthlyView.tsx`**

1. Import `Popover`, `PopoverTrigger`, and `PopoverContent` from the existing UI components
2. Replace the static `<p>+X more</p>` text with a `PopoverTrigger` button
3. The `PopoverContent` will display a scrollable list of ALL tasks for that day (not just the overflow), with the day's date as a header
4. Each task in the popover will use the existing `DealCard` component (compact mode) and remain clickable to open the task detail panel

### Technical Details

- Import `Popover, PopoverTrigger, PopoverContent` from `@/components/ui/popover`
- Wrap the "+X more" in a Popover:
  ```
  <Popover>
    <PopoverTrigger asChild>
      <button className="text-[10px] text-primary cursor-pointer hover:underline ...">
        +{dayTasks.length - 3} more
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-64 p-2" align="start">
      <p className="text-xs font-medium mb-2">{format(day, 'MMM d')} - All Events</p>
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {dayTasks.map(task => (
          <DealCard key={task.id} task={task} compact onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </PopoverContent>
  </Popover>
  ```
- Style the trigger as `text-primary` with `hover:underline` so it looks interactive
- The popover content gets a max height with scroll for days with many tasks
