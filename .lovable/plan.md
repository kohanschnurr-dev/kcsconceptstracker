
## Fix: Due Date Not Displaying After Save

### Root Cause (Two Bugs)

**Bug 1 — Timezone parse (`new Date("YYYY-MM-DD")` = UTC midnight, shows wrong day)**

In `src/pages/DailyLogs.tsx`, the due date is displayed in two places using raw `new Date()`:
- Line 943 (mobile card): `format(new Date(task.dueDate), 'MMM d, yyyy')`  
- Line 1112 (desktop table): `format(new Date(task.dueDate), 'MMM d, yyyy')`

`new Date("2026-02-20")` parses as **UTC midnight**. In US timezones (UTC-5 to UTC-8), this becomes Feb 19 at 7pm–4pm local time. So `format()` renders the *previous* day. The `ProjectTasks.tsx` component already uses the correct `formatDisplayDateShort()` from `dateUtils.ts` (which parses as local time with `new Date(year, month-1, day)`).

**Bug 2 — Stale optimistic state: due date shows `—` immediately after save**

When the user saves a due date via the "Edit Task" modal (`handleSaveDetail`), the code:
1. Calls `supabase.update(...)` 
2. Calls `setDetailModalOpen(false)` — modal closes  
3. Calls `fetchTasks()` — async re-fetch starts

There is a brief window where the table re-renders (because the modal closed) with the **old** `allTasks` state (where `dueDate` is still `null`). `fetchTasks` completes shortly after and updates the state, but if the user screenshots at that exact moment (or the network is slow), they see `—`.

The same pattern affects the `handleUpdateDueDate` CalendarPlus popover: it closes the popover and calls `fetchTasks()`, but again the table briefly shows the old `—` value.

### The Fix

**File: `src/pages/DailyLogs.tsx`** — Two targeted changes:

**Fix 1 — Replace raw `new Date()` with timezone-safe `parseDateString()`**

Import `parseDateString` from `@/lib/dateUtils` and replace both display calls:

```typescript
// Line 943 (mobile) — BEFORE:
{format(new Date(task.dueDate), 'MMM d, yyyy')}

// AFTER:
{format(parseDateString(task.dueDate), 'MMM d, yyyy')}

// Line 1112 (desktop table) — BEFORE:
<span className="text-sm">{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>

// AFTER:
<span className="text-sm">{format(parseDateString(task.dueDate), 'MMM d, yyyy')}</span>
```

**Fix 2 — Optimistically update `allTasks` immediately after both save paths**

In `handleSaveDetail` (Edit Task modal Save):
```typescript
// After successful update, immediately update allTasks state:
setAllTasks(prev => prev.map(t => 
  t.id === selectedTask.id 
    ? { ...t, title: editForm.title.trim(), description: editForm.description.trim() || null, dueDate: editForm.dueDate || null, priorityLevel: editForm.priorityLevel, status: editForm.status }
    : t
));
// Then close modal and re-fetch in background
setDetailModalOpen(false);
fetchTasks(); // background sync
```

In `handleUpdateDueDate` (CalendarPlus popover):
```typescript
// After successful update, immediately update allTasks state:
setAllTasks(prev => prev.map(t =>
  t.id === task.id
    ? { ...t, dueDate: date ? format(date, 'yyyy-MM-dd') : null }
    : t
));
setDueDatePickerTaskId(null);
fetchTasks(); // background sync
```

This follows the established "silent refresh" pattern documented in memory (`ux/silent-data-refresh`): update state optimistically first for instant UI response, then re-fetch in the background to confirm with the server.

### Files to Change

- `src/pages/DailyLogs.tsx` only:
  1. Add `parseDateString` to the import from `@/lib/dateUtils` (it may already be imported — check)
  2. Replace line 943 `new Date(task.dueDate)` → `parseDateString(task.dueDate)`
  3. Replace line 1112 `new Date(task.dueDate)` → `parseDateString(task.dueDate)`
  4. Add optimistic `setAllTasks` update in `handleSaveDetail` (after DB success, before closing modal)
  5. Add optimistic `setAllTasks` update in `handleUpdateDueDate` (after DB success, before closing popover)

### What Stays the Same

- `ProjectTasks.tsx` is already correct — no changes needed
- `handleSaveEdit` (daily log edit) is unrelated — no changes
- All DB queries and RLS policies are working correctly (confirmed the date IS in the DB)
- `fetchTasks` still runs as a background sync to confirm the latest server state
