

## Add Expense Type Badges to the All Expenses Table

### What You'll Get
Every expense in the "All Expenses" feed on the Budget page will display a small color-coded badge next to the category showing whether it's a **Loan**, **Monthly**, or standard construction expense. This gives you at-a-glance separation without removing them from the unified feed.

### Visual Design
- **Loan** expenses: A blue "Loan" badge next to the category column
- **Monthly** expenses: A teal "Monthly" badge next to the category column  
- **Product/Labor** (standard construction): No extra badge -- stays clean as-is
- Loan expenses that have no category will show "Loan Payment" instead of "Unknown" in the category column

### Technical Changes

**File: `src/pages/ProjectBudget.tsx`**

1. **Category column** (lines 1169-1173): Add an expense type badge next to the category badge for loan and monthly expenses. Loan expenses with no `category_id` will display "Loan Payment" instead of calling `getCategoryLabel` with an empty string.

2. **Add a "Type" filter option**: Add expense type filtering to the existing filter bar so you can quickly isolate just Loan or Monthly expenses from the feed. This adds a new select dropdown with options: All Types, Construction, Monthly, Loan.

3. **Update `filteredExpenses` memo** (line 364): Add the expense type filter logic alongside the existing category/payment/date filters.

### Summary
- One file modified: `src/pages/ProjectBudget.tsx`
- Adds type badges for visual separation in the expense table
- Adds a Type filter dropdown to isolate loan/monthly expenses
- No database changes needed
