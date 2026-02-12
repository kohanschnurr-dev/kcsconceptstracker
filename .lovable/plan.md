

## Fix "Send Back to Queue" to Remove Expense from Project

### Problem
When you click "Send Back to Queue" on an imported QuickBooks expense, it only resets the `quickbooks_expenses` record back to pending. It never deletes the corresponding record from the `expenses` table, so the expense remains visible in the project's budget feed -- and if you re-import it, you get duplicates.

### Root Cause
When a QB expense is imported, a new row is inserted into the `expenses` table AND the `quickbooks_expenses` row is marked as imported. But there's no link between the two records. The "send back" logic only touches `quickbooks_expenses` and has no way to find and remove the matching `expenses` row.

### Solution

**1. Database migration -- add a `qb_expense_id` column to the `expenses` table**

Add a nullable `qb_expense_id` column (text) to the `expenses` table. This stores the `quickbooks_expenses.id` when the expense was created via QB import, giving us a reliable link to clean up later.

**2. Update `src/hooks/useQuickBooks.ts` -- store the link on import**

When inserting into the `expenses` table during categorization, include `qb_expense_id` set to the QB expense's ID. This applies to both single imports and split imports.

**3. Update `src/components/ExpenseDetailModal.tsx` -- delete expense record on send-back**

Before resetting the `quickbooks_expenses` record, delete any rows from the `expenses` table where `qb_expense_id` matches the QB expense ID being sent back.

**4. Update `src/components/GroupedExpenseDetailModal.tsx` -- delete expense records on send-back**

Same fix for the grouped (split) send-back flow: delete all `expenses` rows linked to the split QB IDs before resetting/deleting the QB records.

### Technical Details

```text
Database migration:
  ALTER TABLE expenses ADD COLUMN qb_expense_id text;
```

Files modified:
- `src/hooks/useQuickBooks.ts` -- pass `qb_expense_id` when inserting expenses
- `src/components/ExpenseDetailModal.tsx` -- add delete from `expenses` where `qb_expense_id = expense.id` before resetting
- `src/components/GroupedExpenseDetailModal.tsx` -- same delete logic for grouped/split expenses

No UI changes needed -- this is purely a data cleanup fix.
