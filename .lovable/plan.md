## Root cause

`NewEventModal` inserts a `dependencies` field into `calendar_events`:
```ts
dependencies: dependencies.length > 0 ? dependencies : null,
```
But `calendar_events` has no `dependencies` column (verified against the live schema — columns: title, project_id, user_id, start_date, end_date, event_category, trade, is_critical_path, lead_time_days, expected_date, notes, checklist, recurrence_*, is_completed, completed_at, linked_task_id). Supabase rejects the insert → "Failed to create event".

## Fix

**Migration: add `dependencies` column to `calendar_events`**

```sql
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS dependencies jsonb;
```

- `jsonb` matches the array-of-objects shape `[{ taskId, type }]` already serialized by the modal and read back in `Calendar.tsx`.
- Nullable, no default — preserves existing rows.
- No RLS changes needed; existing row policies cover the new column.

## Why this approach over stripping the field

- Predecessor links are real product data shown in the Gantt and TaskDetailPanel; persisting them is required for the feature to function across sessions.
- Codebase already reads/writes `dependencies` end-to-end; the schema gap is the only missing piece.

## Out of scope

No code changes — `NewEventModal.tsx` and `Calendar.tsx` already handle the field correctly.
