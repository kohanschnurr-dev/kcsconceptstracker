

## Dashboard Quick Actions Refactor

### What Changes

1. **Rename "Today's Agenda" to "Quick Actions"** in the banner header.
2. **Replace the "Quick add task..." input row** with a compact "Add Task" button placed in the same grid row as "View Calendar", "Tasks Overdue", and "View Events" -- making it a 4-column grid.
3. **New "Add Task" dialog** opens when the button is clicked, matching the Edit Task modal UI (Title, Description, Priority, Status, Due Date, Photos) but without the Delete button.

### Technical Details

**`src/components/dashboard/TasksDueTodayBanner.tsx`**

- Line 151: Change `"Today's Agenda"` to `"Quick Actions"`.
- Lines 159-233: Change the grid from `grid-cols-3` to `grid-cols-4` and add a 4th box with a `Plus` icon and an "Add Task" button.
- Add state for `addTaskOpen` boolean. When clicked, open the new `AddTaskDialog`.
- Accept a new `onTaskCreated` callback prop and pass it through.

**`src/components/dashboard/AddTaskDialog.tsx`** (new file)

A Dialog matching the Edit Task modal layout from DailyLogs:
- Title (Input)
- Description (Textarea, placeholder "Add details...")
- Priority (Select: Low/Medium/High/Urgent, default Medium) + Status (Select: Pending/In Progress/Completed, default Pending) in a 2-column grid
- Due Date (native date input)
- Photos (TaskPhotoUploader component, extracted or duplicated)
- Footer: Cancel + Save buttons (no Delete since it's a new task)
- On save: insert into `tasks` table with `user_id`, call `onTaskCreated` callback, close dialog

**`src/pages/Index.tsx`**

- Remove the `QuickTaskInput` import and its `<div className="glass-card p-4">` wrapper (lines 364-366).
- Pass `onTaskCreated={() => setTaskRefreshKey(k => k + 1)}` to `TasksDueTodayBanner`.

**`src/components/dashboard/TasksDueTodayBanner.tsx` (props)**

- Add `onTaskCreated?: () => void` to the props interface.

