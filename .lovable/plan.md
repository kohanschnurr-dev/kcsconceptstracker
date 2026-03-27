

## Plan: Fix QuickBooks Expense Double-Counting on Projects Page

### Problem
The Dashboard (`Index.tsx`) deduplicates QuickBooks expenses by checking each QB expense against `qb_expense_id` on regular expenses, using only non-duplicated entries. The Projects page (`Projects.tsx`) skips this step entirely — it adds ALL QB imported expenses on top of regular expenses, double-counting any that were already imported as regular expenses.

This inflates `constructionByProject`, `transactionByProject`, and `holdingByProject` totals on the Projects page, producing different profit numbers than the Dashboard.

### Fix

**File: `src/pages/Projects.tsx`**

1. Expand the regular expenses query to also fetch `qb_expense_id`:
   ```typescript
   .select('category_id, amount, project_id, cost_type, qb_expense_id')
   ```

2. Before processing QB expenses, build a dedup set and filter — same pattern as `Index.tsx`:
   ```typescript
   const importedQbIds = new Set(
     (expensesData || [])
       .filter(e => e.qb_expense_id)
       .map(e => e.qb_expense_id)
   );
   const dedupedQbExpenses = (qbExpensesData || []).filter(e => !importedQbIds.has(e.id));
   ```

3. Replace `(qbExpensesData || [])` with `dedupedQbExpenses` in the two forEach loops (lines 122-137).

### Files touched
- `src/pages/Projects.tsx` (~6 lines changed)

