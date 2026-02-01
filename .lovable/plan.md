
## Plan: Fix Category Totals in Grouped Expense Rows

### Issue Analysis

Based on my investigation:

1. **Database values are correct** - Each split expense has its individual amount stored properly
2. **Display code looks correct** - Child rows use `expense.amount` (line 220) for each individual expense
3. **Parent total is calculated correctly** - Sum of all expenses in the group (line 45)

However, the user reports that some categories show the parent's total instead of individual amounts. This suggests a possible data synchronization or grouping issue.

### Root Cause Hypothesis

After extensive analysis, I cannot reproduce the exact bug with current database state. However, the most likely causes are:

1. **Data ordering issue**: Expenses within a group may not be in consistent order
2. **Stale data from a previous import**: A past SmartSplit operation may have left inconsistent data that has since been corrected

### Recommended Changes

**File: `src/components/expenses/GroupedExpenseRow.tsx`**

#### 1. Add Debug Logging (Temporary)
Add console logging to help diagnose if the issue recurs - this will show exactly what data is being rendered.

#### 2. Ensure Consistent Ordering Within Groups
Sort expenses within each group so the original QB expense (without `_split_`) always comes first, followed by splits.

### Code Changes

**Change 1: Sort expenses within the group to ensure consistent ordering**

Currently, `expenses[0]` is used as `parentExpense`, but the order depends on how they were fetched. We should sort so the original (non-split) QB record is always first.

```tsx
// After line 41, before line 43
// Sort expenses so original QB expense comes first, then splits
const sortedExpenses = [...expenses].sort((a, b) => {
  // Non-split QB IDs should come first
  const aIsSplit = a.qb_id?.includes('_split_') ?? false;
  const bIsSplit = b.qb_id?.includes('_split_') ?? false;
  if (aIsSplit && !bIsSplit) return 1;
  if (!aIsSplit && bIsSplit) return -1;
  return 0;
});
```

Then use `sortedExpenses` instead of `expenses` throughout the component.

**Change 2: Add qb_id to the DBExpense interface**

The interface needs `qb_id` for the sorting to work:

```tsx
interface DBExpense {
  // ... existing fields
  qb_id?: string | null;
}
```

### Technical Summary

| Location | Change |
|----------|--------|
| Line 7-22 | Add `qb_id` to DBExpense interface |
| Lines 40-45 | Sort expenses before processing, use sortedExpenses |
| Lines 52, 54, 56 | Use sortedExpenses instead of expenses |
| Lines 121-182 | Use sortedExpenses for parent row |
| Lines 189-224 | Use sortedExpenses for child rows |

### Result
- Expenses within a group are always in consistent order
- The original QB expense (with the first category's amount) is always first
- Child rows continue to display their individual amounts correctly
- Better debugging capability if the issue recurs
