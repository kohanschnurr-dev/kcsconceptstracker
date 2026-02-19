
## Change: Calendar Icon → Due Date Picker (Daily Logs Page)

### What's Changing

The `CalendarPlus` icon button currently instant-assigns a task to "today's sprint" (`scheduled_date = today`). The user wants it to open a **date picker popover** to set or change the task's **due date** instead.

This change applies to both views on the page:
- **Desktop table view** (line 1100–1109)
- **Mobile card view** (line 948–957)

### How It Will Work

1. User clicks the calendar icon next to any task
2. A popover opens with a date picker (same style as the "Add Task" date picker already on this page)
3. User picks a date → due date is saved to the database instantly
4. Popover closes, the Due Date column updates to show the new date
5. If a date is already set, the picker opens pre-selected on that date
6. A "Clear date" option allows removing the due date

### Technical Details

**New state needed:**
```typescript
const [dueDatePickerTaskId, setDueDatePickerTaskId] = useState<string | null>(null);
```

**New handler:**
```typescript
const handleUpdateDueDate = async (task: Task, date: Date | undefined) => {
  const { error } = await supabase
    .from('tasks')
    .update({ due_date: date ? format(date, 'yyyy-MM-dd') : null })
    .eq('id', task.id);
  if (!error) {
    fetchTasks();
    setDueDatePickerTaskId(null);
  }
};
```

**Button replacement (both mobile + desktop):**

Replace the plain `<Button onClick={() => handleAssignToToday(task)}>` with a `<Popover>` wrapping a `<Calendar>` picker — exactly the same pattern already used in the "Add Task" area of this same page (line 808–829).

The `CalendarPlus` icon stays, but the tooltip changes from "Assign to Today" to "Set Due Date".

### Files to Change

- `src/pages/DailyLogs.tsx` only
  - Add `dueDatePickerTaskId` state variable
  - Add `handleUpdateDueDate` function
  - Replace `CalendarPlus` button with `Popover + Calendar` in the **mobile card view** (around line 948)
  - Replace `CalendarPlus` button with `Popover + Calendar` in the **desktop table view** (around line 1100)
  - Remove `handleAssignToToday` function (no longer needed for this button)
  - Add `Popover`, `PopoverContent`, `PopoverTrigger` to imports (already imported — check first)

### Imports Check

`Popover`, `PopoverContent`, `PopoverTrigger` are already imported (used in the Add Task area at line ~808). `Calendar` component is already imported. `format` from `date-fns` is already imported. No new dependencies needed.

### What Stays the Same

- The `handleUnassignFromDay` function and the `X` button in the Daily Sprint tab remain unchanged
- The "Today" badge on tasks still shows when `scheduledDate === todayStr`
- Everything else on the page is untouched
