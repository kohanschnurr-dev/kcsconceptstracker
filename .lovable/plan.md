

## Plan: Click Category in Expense Breakdown to Filter All Expenses

### What
Clicking a category name/row in the "Expense Breakdown by Category" legend (or a pie slice) will auto-set the category filter in the "All Expenses" table below and scroll to it.

### Changes

**`src/pages/ProjectBudget.tsx`**

1. Add a `handleCategoryBreakdownClick` function that:
   - Sets `selectedCategory` to the clicked category's value (or toggles back to `'all'` if already selected)
   - Resets other filters (search, payment method, cost type, date range)
   - Scrolls to `expensesTableRef` smoothly (same pattern as `handleCardFilter`)

2. On the legend rows (line ~965): add `onClick={() => handleCategoryBreakdownClick(cat.category)}` and `cursor-pointer` class

3. On the Pie chart (line ~907): add an `onClick` handler on each `<Cell>` that triggers the same filter using the sorted categories array to resolve the clicked index back to a category value

Single file, ~15 lines of new code.

