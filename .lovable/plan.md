

## Add "Mark Complete" Check-off to Calendar Events

### Problem
Calendar events have no completion toggle. Some events originate from tasks (via "Save & Add to Calendar"), but there's no link between them, so completing an event doesn't update the source task. Overdue tasks that were actually done require navigating to the tasks list to mark them complete.

### Changes

#### 1. Database Migration
- Add `is_completed` (boolean, default false) and `completed_at` (timestamptz, nullable) to `calendar_events`
- Add `linked_task_id` (UUID, nullable, FK to `tasks`) to `calendar_events` — this links events created via "Save & Add to Calendar" back to their source task

#### 2. Wire up the link: `AddTaskModal.tsx`
- When "Save & Add to Calendar" creates the calendar event, pass the newly created task's ID as `linked_task_id` in the event insert
- Requires the `saveTask` function to return the created task ID (currently it doesn't)

#### 3. Add completion toggle: `TaskDetailPanel.tsx`
- Add a prominent check-off button at the top of the event detail panel (next to the title) — a circle/checkmark toggle
- When toggled to complete:
  - Update `calendar_events` row: set `is_completed = true`, `completed_at = now()`
  - If `linked_task_id` exists, also update the linked task's status to `'completed'` in the `tasks` table
  - Show a success toast: "Event completed" (and "Linked task also marked complete" if applicable)
- When toggled back to incomplete: reverse both updates
- Visual: completed events get a strikethrough title and muted styling

#### 4. Visual indicator on calendar grid: `DealCard.tsx`
- Show a small checkmark icon or reduced opacity on completed events in the calendar grid so users can see at a glance what's done

#### 5. Update `CalendarTask` type (`Calendar.tsx`)
- Add `isCompleted`, `completedAt`, and `linkedTaskId` fields to the `CalendarTask` interface
- Map these from the DB response in all fetch functions

### Files to change
- **Database migration** — add columns to `calendar_events`
- `src/pages/Calendar.tsx` — update `CalendarTask` type
- `src/components/calendar/TaskDetailPanel.tsx` — add completion toggle + linked task update
- `src/components/calendar/DealCard.tsx` — visual completed state
- `src/components/project/AddTaskModal.tsx` — return task ID from save, pass to calendar event
- `src/components/project/ProjectCalendar.tsx` — map new fields when fetching events

