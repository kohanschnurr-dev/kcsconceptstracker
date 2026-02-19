
## Fix: Eliminate All UTC Date Parsing Bugs Across the Entire Codebase

### Root Cause (One Sentence)

`new Date("2026-02-20")` parses as **UTC midnight**, so in any US timezone (UTC-5 to UTC-8) it renders as the previous day — Feb 19. This bug exists in 5 components beyond the `DailyLogs.tsx` display fixes already applied.

### All Affected Files

**Already fixed (last diff):**
- `src/pages/DailyLogs.tsx` — display lines 955 and 1124 now use `parseDateString()` ✓

**Still broken — need to fix now:**

1. **`src/components/dashboard/TasksDueTodayBanner.tsx`** (critical — logic bug, not just display)
   - Line 96: `isToday(new Date(t.dueDate))` — determines whether a task shows in the "due today" banner
   - Line 101-102: `isPast(new Date(t.dueDate))` + `!isToday(new Date(t.dueDate))` — determines the overdue count badge
   - **Impact:** A task due Feb 20 is seen as Feb 19 at UTC, so at any local time it appears as "overdue" instead of "due today" — the banner shows the wrong tasks all day

2. **`src/components/dashboard/UrgentTasksWidget.tsx`** (sorting)
   - Line 154: `new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()` — sort order comparison
   - **Impact:** Sort order shifts by 1 day; tasks may sort incorrectly relative to today

3. **`src/components/SplitExpenseModal.tsx`** (display)
   - Line 167: `new Date(expense.date).toLocaleDateString()` — expense date display
   - **Impact:** Expense date shows one day early in US timezones

4. **`src/components/project/DraggableDocumentCard.tsx`** (display + relative time)
   - Line 45: `new Date(date).toLocaleDateString(...)` — document date display
   - Line 53: `new Date(dateStr)` for relative time calculation ("Today", "Yesterday", "X days ago")
   - **Impact:** "Uploaded today" shows as "Yesterday"; date display is one day off
   - Note: These take `created_at` (timestamp) or `uploaded_date` — need to verify if they're date-only strings. Since document cards use `created_at` (a full timestamp), this is likely safe. Will use `parseDateString` only for date-only fields.

5. **`src/components/ops/CompactDashboardWidgets.tsx`** (chart bucketing)
   - Line 83: `isSameDay(new Date(e.date), date)` — groups expenses by day for the spending chart
   - **Impact:** Expenses appear on the wrong day in the 30-day trend chart

### The Fix Strategy

Import `parseDateString` from `@/lib/dateUtils` in each file, and replace `new Date(dateOnlyString)` with `parseDateString(dateOnlyString)` for any field that stores a `YYYY-MM-DD` date-only string. Full-timestamp fields (`created_at`, `updated_at`, `completed_at`, `joined_at`) use `new Date()` correctly since they include time info.

### Field Type Reference

| Field | Type | Fix needed? |
|-------|------|-------------|
| `task.dueDate` / `t.due_date` | `date` (YYYY-MM-DD) | Yes |
| `expense.date` / `e.date` | `date` (YYYY-MM-DD) | Yes |
| `task.startDate` / `task.endDate` (CalendarTask) | Already `Date` object | No — already safe |
| `created_at`, `updated_at`, `joined_at`, `completed_at` | `timestamptz` (full ISO timestamp) | No — already safe |
| `photo_date` | `date` (YYYY-MM-DD) | Yes, but only where used in date-only comparisons |
| `document.created_at` (DraggableDocumentCard) | `timestamptz` | No — already safe |

### Exact Changes Per File

**File 1: `src/components/dashboard/TasksDueTodayBanner.tsx`**
- Add `import { parseDateString } from '@/lib/dateUtils'`
- Replace `isToday(new Date(t.dueDate))` → `isToday(parseDateString(t.dueDate))`
- Replace `isPast(new Date(t.dueDate))` → `isPast(parseDateString(t.dueDate))`
- Replace `!isToday(new Date(t.dueDate))` → `!isToday(parseDateString(t.dueDate))`

**File 2: `src/components/dashboard/UrgentTasksWidget.tsx`**
- Add `import { parseDateString } from '@/lib/dateUtils'`
- Replace `new Date(a.dueDate).getTime()` → `parseDateString(a.dueDate).getTime()`
- Replace `new Date(b.dueDate).getTime()` → `parseDateString(b.dueDate).getTime()`

**File 3: `src/components/SplitExpenseModal.tsx`**
- Add `import { parseDateString } from '@/lib/dateUtils'`
- Replace `new Date(expense.date).toLocaleDateString()` → `parseDateString(expense.date).toLocaleDateString()`

**File 4: `src/components/ops/CompactDashboardWidgets.tsx`**
- Add `import { parseDateString } from '@/lib/dateUtils'`
- Replace `isSameDay(new Date(e.date), date)` → `isSameDay(parseDateString(e.date), date)`

**File 5: `src/components/project/DraggableDocumentCard.tsx`**
- The `formatDate` and `getRelativeTime` functions receive `created_at` (a full ISO timestamp), NOT a date-only string — so `new Date(date)` is correct here. No change needed.

### What Stays the Same

- `GanttView.tsx` — `task.startDate`/`task.endDate` are already `Date` objects parsed via `parseDateString` in `Calendar.tsx`; wrapping in `new Date(Date)` is a no-op — safe
- `GoalsPopout.tsx` line 127 — uses `dateStr + 'T00:00:00'` (local midnight, correct approach)
- `GoalsPopout.tsx` line 158 — `goal.completed_at` is a timestamp, safe
- `OrderRequestsPanel.tsx` — `order.created_at` is a timestamp, safe
- `ManageUsersCard.tsx` — `member.joined_at` is a timestamp, safe
- All `format(new Date(), ...)` calls — `new Date()` with no args is always current time, safe

### Files to Change

1. `src/components/dashboard/TasksDueTodayBanner.tsx` — 3 replacements
2. `src/components/dashboard/UrgentTasksWidget.tsx` — 2 replacements
3. `src/components/SplitExpenseModal.tsx` — 1 replacement
4. `src/components/ops/CompactDashboardWidgets.tsx` — 1 replacement

After these 4 files, every date-only string from the database will be parsed with `parseDateString()` app-wide. No more off-by-one day errors anywhere.
