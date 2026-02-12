

## Fix: Apply Deduplication to All Remaining Pages

The Budget page fix is working. The same duplicate issue exists in **two more pages** that merge `quickbooks_expenses` with `expenses` without filtering out already-imported records.

### Pages to Fix

**1. Dashboard (`src/pages/Index.tsx`) -- Lines 92-168**
- QB expenses are merged into category spend calculations (lines 97-101) and into the combined expense list (lines 152-168) without checking if they already exist as regular expenses.
- Fix: Add `importedQbIds` Set from `expensesData`, filter `qbExpensesData` before both the category calculation and the expense list merge.

**2. Project Detail (`src/pages/ProjectDetail.tsx`) -- Lines 253-284**
- QB expenses are merged into category spend (lines 257-261) and into `combinedExpenses` (line 284) without dedup.
- Fix: Same pattern -- collect `qb_expense_id` values from expenses, filter QB records before merging.

Note: The **Expenses page** (`src/pages/Expenses.tsx`) already has this dedup logic at lines 141-150 -- no changes needed there.

### Technical Details

Both fixes follow the exact same pattern already proven on the Budget page:

```ts
// Collect QB IDs already imported as regular expenses
const importedQbIds = new Set(
  expensesData
    .filter(e => e.qb_expense_id)
    .map(e => e.qb_expense_id)
);

// Filter before any merge or calculation
const dedupedQbExpenses = qbExpensesData.filter(qb => !importedQbIds.has(qb.id));
```

### Files Modified
- `src/pages/Index.tsx` -- add dedup filter before category spend calculation and expense list merge
- `src/pages/ProjectDetail.tsx` -- add dedup filter before category spend calculation and combined expenses merge
