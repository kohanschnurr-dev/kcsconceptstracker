

## Goals Enhancement: History, Dates, and Active-Only Dashboard

### 1. Database Changes

Add columns to `quarterly_goals` table:
- `start_date` (date, nullable) -- when the goal starts
- `due_date` (date, nullable) -- target completion date
- `completed_at` (timestamptz, nullable) -- when goal was marked complete (null = active)

A goal is "active" when `completed_at IS NULL` and "completed" when it has a value.

### 2. Dashboard Widget (CompactDashboardWidgets.tsx)

Filter goals passed to the widget to only show **active** goals (where `completed_at` is null). The count will reflect only active goals, so with 1 active goal it shows "1 goal".

### 3. Goals Popout (GoalsPopout.tsx)

**Active Goals Section** (shown by default):
- Show only goals where `completed_at` is null
- Display start/due dates beneath each goal title
- Add a "Complete" button (checkmark) on each goal card to mark it done

**Completed Goals History** (collapsible section at bottom):
- Show goals where `completed_at` is not null
- Display completion date
- Collapsed by default with a toggle like "View Completed (3)"

**Add Goal Form Updates**:
- Add optional start date and due date fields (date pickers)

### 4. Data Flow (BusinessExpenses.tsx)

- Fetch all goals (both active and completed) from the database
- Pass all goals to `GoalsPopout` (it handles filtering internally)
- Pass only active goals to `CompactDashboardWidgets`
- Add `onCompleteGoal` callback to set `completed_at = now()` in the database
- Include `start_date`, `due_date`, `completed_at` in the select query

### Technical Details

**Migration SQL**:
```sql
ALTER TABLE quarterly_goals
  ADD COLUMN start_date date,
  ADD COLUMN due_date date,
  ADD COLUMN completed_at timestamptz;
```

**Files modified**:
- `src/components/ops/GoalsPopout.tsx` -- add history section, date display, complete button, date inputs in form
- `src/components/ops/CompactDashboardWidgets.tsx` -- filter to active goals only for count and progress bars
- `src/pages/BusinessExpenses.tsx` -- update query to include new columns, filter active goals for widget, add onCompleteGoal handler

**Goal interface update**:
```typescript
interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number | null;
  category: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
}
```
