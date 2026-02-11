

## Sort Category Dropdown A-Z in Expense Detail Modal

### Change

**File: `src/components/ExpenseDetailModal.tsx`** (around line 475)

Sort the `categories` array alphabetically by their display label before rendering the `SelectItem` list. Currently the categories render in whatever order they come from the database.

Add a `.sort()` call that resolves each category's label via `getBudgetCategories()` and compares them with `localeCompare`:

```
categories
  .slice()
  .sort((a, b) => {
    const labelA = getBudgetCategories().find(c => c.value === a.category)?.label || a.category;
    const labelB = getBudgetCategories().find(c => c.value === b.category)?.label || b.category;
    return labelA.localeCompare(labelB);
  })
  .map((cat) => { ... })
```

This is a single-line chain addition -- no new files, no new dependencies.
