

## Add Cost Type Classification to Project Budget Expenses

### Overview
Add a new "Type" column to the project budget's "All Expenses" table (between Description and Amount) that lets users classify each expense as **Construction**, **Loan**, or **Monthly**. This classification is clickable inline -- no modal needed.

### Database Change

Add a new `cost_type` column to the `expenses` table (separate from the existing `expense_type` which tracks product/labor):

```text
ALTER TABLE expenses ADD COLUMN cost_type text NOT NULL DEFAULT 'construction';
```

Default is `'construction'` since all existing expenses are construction costs. Valid values: `'construction'`, `'loan'`, `'monthly'`.

### UI Changes

**File: `src/pages/ProjectBudget.tsx`**

1. Add a new "Type" column header between "Description" and "Amount" in the All Expenses table
2. In each expense row, render a small inline `Select` dropdown (or clickable badge) in that column showing the current cost type (Construction / Loan / Monthly)
3. Clicking it opens a dropdown to change the type -- on change, update the `expenses` record's `cost_type` in the database and refresh
4. Add `cost_type` to the `DBExpense` interface
5. Add a "Type" filter dropdown to the filter bar (All Types / Construction / Loan / Monthly)
6. Update `filteredExpenses` memo to support the new type filter
7. Update `clearFilters` and `hasActiveFilters` to include the type filter
8. Include cost type in CSV export

**Inline Select behavior:**
- Displays as a small badge-styled select: "Construction" (default), "Loan", or "Monthly"
- Clicking stops row propagation (doesn't open detail modal)
- On change, calls `supabase.from('expenses').update({ cost_type }).eq('id', exp.id)` then refreshes

### What stays the same
- The existing `expense_type` column (product/labor) is untouched -- it serves a different purpose
- No changes to QuickBooks import flow
- No changes to the Expenses page or other pages
