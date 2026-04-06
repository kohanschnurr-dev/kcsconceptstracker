

## Plan: Auto-Delete Stale Hidden Expenses (30+ Days)

When the user navigates to the Expenses tab and there are hidden QuickBooks expenses older than 30 days, show a dialog asking if they want to delete them. Include a checkbox to enable automatic deletion going forward (persisted in `settings_data` on their profile).

### Changes

**1. Database Migration**
- Add `hidden_at timestamptz` column to `quickbooks_expenses` table, defaulting to `now()` for rows where `is_hidden = true`
- Backfill existing hidden rows: `UPDATE quickbooks_expenses SET hidden_at = updated_at WHERE is_hidden = true`

**2. `src/hooks/useQuickBooks.ts`**
- Update `hideExpense` to also set `hidden_at: new Date().toISOString()` when hiding
- Add `fetchStaleHiddenExpenses()` that queries hidden expenses where `hidden_at < now() - 30 days`
- Add `deleteStaleHidden(ids: string[])` to bulk-delete those expenses
- Expose `staleHiddenExpenses` state and the new functions

**3. New Component: `src/components/StaleHiddenExpensesDialog.tsx`**
- AlertDialog that shows when `staleHiddenExpenses.length > 0`
- Message: "You have {N} hidden expenses older than 30 days. Would you like to delete them?"
- Lists a summary (count and total amount)
- Checkbox: "Automatically delete hidden expenses after 30 days"
- Two buttons: "Keep" (dismiss) and "Delete All" (bulk delete)
- On checkbox change, save `auto_delete_stale_hidden: true/false` to `profiles.settings_data`

**4. `src/pages/Expenses.tsx`**
- On mount, check `profiles.settings_data.auto_delete_stale_hidden`
  - If `true`: silently delete stale hidden expenses, show a toast summary
  - If `false`/unset: render `StaleHiddenExpensesDialog` when stale items exist
- Import and render the dialog component

### UI Details
- Clean AlertDialog with clear copy, not intrusive
- Checkbox styled consistently with existing settings checkboxes
- Toast notification for auto-delete: "Deleted {N} hidden expenses older than 30 days"

### Files touched
- Migration: add `hidden_at` column
- `src/hooks/useQuickBooks.ts`
- `src/components/StaleHiddenExpensesDialog.tsx` (new)
- `src/pages/Expenses.tsx`

