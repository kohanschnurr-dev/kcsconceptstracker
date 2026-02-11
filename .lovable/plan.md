

## Add Due Date Picker to Pipeline Quick-Add

Add a calendar date picker button between the project selector and the "Add to Pipeline" button, matching the pattern already used in `QuickTaskInput` on the dashboard.

### Changes

**File: `src/pages/DailyLogs.tsx`**

1. Add state: `const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();`
2. Add imports: `Popover`, `PopoverContent`, `PopoverTrigger` from ui/popover, `Calendar` component from ui/calendar (the calendar icon is already imported), and `format` from `date-fns`, plus `cn` (if not already imported).
3. In the quick-add form (line ~593), after the project `Select` and before the submit `Button`, add a date picker popover button (calendar icon that shows selected date as short label, with a "Clear date" option inside).
4. In `handleCreateTask`, include `due_date: newTaskDueDate ? format(newTaskDueDate, 'yyyy-MM-dd') : null` in the insert payload.
5. Reset `newTaskDueDate` to `undefined` after successful creation (alongside the existing title/project resets).
6. The date picker only shows when `checklistTab === 'master'` (daily sprint tasks already have today's date context).

### UI Layout

The form row will be: `[Task Input] [Project Select] [Date Picker] [Add to Pipeline]`

The date picker button will be compact -- just a calendar icon that turns highlighted when a date is selected, with a short label like "Feb 12" next to the icon (same style as `QuickTaskInput`).
