

## Plan: Add "Send Back to Queue" for QB-Linked Regular Expenses

### Problem
When a QuickBooks transaction is categorized and linked into the `expenses` table (via `qb_expense_id`), it no longer shows the "Send Back to Queue" button because `isQuickBooks` is `false` — it's stored as a regular expense. The user has no way to undo a wrong project assignment.

### Solution
Two changes:

1. **Pass `qb_expense_id` to the modal** so it knows the expense originated from QuickBooks even when stored in the `expenses` table.
2. **Show "Send Back to Queue" for any expense with a QB origin** — either `source === 'quickbooks'` (QB expenses table) or has a `qb_expense_id` (linked regular expense).

### Changes

**File: `src/components/ExpenseDetailModal.tsx`**
- Add `qb_expense_id?: string` to the expense interface
- Change the visibility condition from `isQuickBooks` to `isQuickBooks || !!expense.qb_expense_id`
- Update `handleSendBackToQueue` to handle both cases:
  - If `isQuickBooks` (from QB table): existing logic — reset the QB record
  - If `qb_expense_id` (linked regular expense): delete the regular expense row, then reset the original QB record back to pending

**File: `src/pages/ProjectBudget.tsx`**
- Pass `qb_expense_id` from the selected expense data to the modal's expense prop (~1 line)
- Ensure `qb_expense_id` is included in the `DBExpense` type and fetched in the query

### How "Send Back" works for linked expenses
```
1. Delete the regular expense row (from `expenses` table)
2. Find the original QB record using qb_expense_id
3. Reset it: is_imported=false, project_id=null, category_id=null
4. User sees it back in the QB pending queue
```

### Files touched
- `src/components/ExpenseDetailModal.tsx` (~15 lines changed)
- `src/pages/ProjectBudget.tsx` (~3 lines changed)

