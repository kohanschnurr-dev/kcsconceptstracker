

## Remove Clickable Calendar from Due Date Column

### What Changes

The Due Date column in the desktop task table currently opens a calendar popover when clicked. This will be removed so the due date is plain, non-interactive text -- just like it appears for completed tasks.

### Technical Details

**`src/pages/DailyLogs.tsx`**

- **Lines 1187-1215 (desktop Due Date cell)**: Replace the entire `Popover`/`PopoverTrigger`/`PopoverContent` block and the completed-task branch with a single plain `<span>` that displays the formatted date or "—" dash. No conditional on task status needed since the display is the same either way.
- Remove the `dueDatePickerTaskId` state and `handleUpdateDueDate` references if they are no longer used elsewhere (need to check mobile cards first).
- Remove `CalendarPicker` / `Calendar` import if no longer used anywhere in the file.

Result: The Due Date column becomes a static read-only display, matching the screenshot.
