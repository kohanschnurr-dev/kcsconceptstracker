

## Fix: Eliminate Duplicate Display on Budget Page

### Root Cause
The budget page fetches from **two** tables and merges them:
1. `expenses` table -- contains the imported expense record (with `qb_expense_id` linking back to the QB record)
2. `quickbooks_expenses` table -- contains the original QB record (with `is_imported: true`)

Both records represent the same transaction, so when they're combined on line 258 of `ProjectBudget.tsx`, every imported QB expense appears twice.

### Fix
When merging the two lists, filter out any `quickbooks_expenses` record whose `id` matches a `qb_expense_id` in the `expenses` table. This way, once a QB expense has been imported as a proper expense, only the `expenses` table version shows.

### Technical Details

**File: `src/pages/ProjectBudget.tsx`** (around lines 237-260)

Before the merge on line 258, collect all `qb_expense_id` values from the regular expenses, then exclude matching QB records:

```ts
// Collect QB IDs that have already been imported as regular expenses
const importedQbIds = new Set(
  expensesData
    .filter(e => e.qb_expense_id)
    .map(e => e.qb_expense_id)
);

// Only include QB expenses that haven't been imported as regular expenses
const qbAsExpenses: DBExpense[] = qbExpensesData
  .filter(qb => !importedQbIds.has(qb.id))
  .map(qb => ({
    // ... existing mapping
  }));
```

This also fixes the **category spend double-counting** on lines 229-235, where both the regular expense amount and the QB expense amount are summed for the same transaction. The same filter needs to apply before calculating `qbCategoryExpenses`.

### Files Modified
- `src/pages/ProjectBudget.tsx` -- filter out QB records that already exist as imported expenses before merging and before calculating category totals

