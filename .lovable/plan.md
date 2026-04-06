

## Plan: Hide Expenses Feature

Add an `is_hidden` column to the expenses table so users can hide expenses without deleting them (important since QB expenses re-sync). A small "View Hidden" toggle lets them see and unhide expenses when needed.

### Changes

**1. Database Migration**
- Add `is_hidden boolean default false` to the `expenses` table

**2. `src/pages/Expenses.tsx`**
- Add `showHidden` state toggle (default `false`)
- Filter out `is_hidden = true` expenses from the main list when `showHidden` is false
- Add a small discrete "🗑 Hidden (N)" toggle button next to the search/filter bar — only visible when hidden expenses exist
- When `showHidden` is true, show only hidden expenses with an "Unhide" action on each row

**3. `src/components/expenses/GroupedExpenseRow.tsx`**
- Add an optional `onHide` callback prop
- Show a small hide button (EyeOff icon) on hover for each expense row
- When clicked, calls `onHide(expenseId)` which sets `is_hidden = true` in the DB

**4. `src/pages/Expenses.tsx` — hide/unhide handlers**
- `handleHideExpense(id)`: updates `is_hidden = true` and refreshes
- `handleUnhideExpense(id)`: updates `is_hidden = false` and refreshes

### Files touched
- 1 migration (add `is_hidden` column)
- `src/pages/Expenses.tsx`
- `src/components/expenses/GroupedExpenseRow.tsx`

