

## Fix: Cost Type Changes Not Persisting for QuickBooks Expenses

### Root Cause
When changing the cost type on a QuickBooks expense, the code updates the `expenses` table -- but QuickBooks expenses live in the `quickbooks_expenses` table. The update silently matches zero rows, the optimistic UI update shows briefly, then the next data refresh (triggered by focus/visibility listeners) overwrites it back to the default "Construction".

### Solution

**1. Add `cost_type` column to `quickbooks_expenses` table** (database migration)

```sql
ALTER TABLE quickbooks_expenses ADD COLUMN cost_type text DEFAULT 'construction';
```

**2. Update `handleCostTypeChange` in `src/pages/ProjectBudget.tsx`**

Check whether the expense is a QuickBooks record (`isQuickBooks` flag). If so, update the `quickbooks_expenses` table instead of `expenses`.

```
if (expense.isQuickBooks) {
  update quickbooks_expenses where id = expenseId
} else {
  update expenses where id = expenseId
}
```

**3. Include `cost_type` in QB-to-expense mapping** (line ~220-237)

When converting QB expenses into the merged display list, carry over the `cost_type` field:

```
cost_type: qb.cost_type || 'construction',
```

This ensures cost type selections persist across refreshes for both manual and QuickBooks expenses.
