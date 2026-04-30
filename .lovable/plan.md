## Problems

1. **Save fails with "Failed to save changes"** — The Task Detail panel sends an `owner` field when updating a calendar event, but the `calendar_events` table has no `owner` column. Postgres rejects the update, so nothing persists.

2. **Toast covers the Save button** — The global toast viewport sits at `bottom-0 right-0`. In the Task Detail Sheet, the Save button is at the bottom-right of the panel, so the red error toast renders directly on top of it, blocking clicks.

## Fix

### 1. Database migration

Add the missing column so the existing UI works as designed:

```sql
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS owner text;
```

(`dependencies` already exists as `jsonb`, no change needed.)

### 2. Reposition the toast viewport

Update `src/components/ui/toast.tsx` so toasts appear at the **top-right** on desktop instead of bottom-right. This keeps them visible without overlapping primary action buttons (Save, Delete) which typically sit at the bottom of dialogs/sheets.

Change line 17 from:
```
"fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
```
to:
```
"fixed top-0 z-[100] flex max-h-screen w-full flex-col p-4 sm:right-0 sm:top-0 sm:flex-col md:max-w-[420px]"
```

This is a global change — toasts across the entire app will now appear top-right, away from action buttons.

## Files Touched

- New migration: add `owner text` column to `calendar_events`
- `src/components/ui/toast.tsx` — toast viewport position

## Verification

- Open the Clear Path event, edit any field, click Save → toast appears top-right, change persists, no error.
- Reload to confirm the saved owner/dependencies values come back.
