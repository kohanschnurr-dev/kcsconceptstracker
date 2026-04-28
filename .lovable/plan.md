## Goal

When a calendar event is linked to a task (`calendar_events.linked_task_id`), moving/rescheduling the event should automatically update the linked task's `due_date` (and `scheduled_date` if scheduled) to match the event's new start date. The task in the Daily Logs / Checklist will stay in sync.

## Current State

- `calendar_events.linked_task_id` already references `tasks.id`.
- Tasks are created with this link from `AddTaskModal` → `NewEventModal`.
- The link is currently one-way (used only to navigate / mark-complete sync). Date changes on the event do **not** propagate to the task.

## Changes

### 1. New helper: `src/lib/syncLinkedTask.ts`

Single shared utility used by every event-date writer.

```ts
// syncLinkedTaskDate(eventId, newStartDate)
// 1. Look up calendar_events.linked_task_id for eventId
// 2. If present, update tasks.due_date = newStartDate (yyyy-mm-dd)
//    Also update scheduled_date when the row has is_scheduled = true
// 3. Silently no-op if no link / not found
```

Keeps logic in one place so future writers stay consistent.

### 2. Wire helper into all event-move paths

Call `syncLinkedTaskDate(eventId, newStart)` immediately after each successful `calendar_events` update:

- `src/pages/Calendar.tsx` → `handleTaskMove` (drag on global calendar / Gantt)
- `src/components/project/ProjectCalendar.tsx` → `persistTaskMove` (drag + Gantt inside project)
- `src/components/calendar/TaskDetailPanel.tsx` → save handler at line ~197 (manual date edit in side panel)

### 3. Reverse direction (out of scope, optional)

Not changing task → event sync in this pass. The user asked specifically about event date moves driving the task date. We can revisit if they want bidirectional later.

## Technical Notes

- All updates go through Supabase with existing RLS — no schema or migration needed since `linked_task_id` already exists.
- Use `parseDateString` / `format(d, 'yyyy-MM-dd')` to avoid the known UTC off-by-one issue (per project memory).
- After the DB update, refresh local React state in the Daily Logs/Checklist views via their existing query invalidations — no extra wiring needed because they refetch on focus / mount, but we'll also broadcast a lightweight refetch where convenient.

## Files Touched

- `src/lib/syncLinkedTask.ts` (new)
- `src/pages/Calendar.tsx`
- `src/components/project/ProjectCalendar.tsx`
- `src/components/calendar/TaskDetailPanel.tsx`
