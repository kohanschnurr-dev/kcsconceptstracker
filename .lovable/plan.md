

## Remove Loan and Monthly Expense Types from QuickBooks Pending Cards

### Overview
Strip out the "Loan" and "Monthly" options from the QuickBooks pending expense card's "More" popover, along with all related UI and logic that was recently added. This is a clean rollback so we can start fresh on this feature later.

### Changes

**File 1: `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**
- Remove the `Landmark`, `Zap`, and `MoreHorizontal` icon imports (no longer needed)
- Remove the `Popover`/`PopoverContent`/`PopoverTrigger` imports (no longer needed for this component)
- Remove `morePopoverOpen` state
- Simplify `selectedExpenseType` state type from `'product' | 'labor' | 'loan' | 'monthly'` to just `'product' | 'labor'`
- Remove the entire "More" popover button and its contents (the `...` button with Loan/Monthly options)
- Remove the loan/monthly label text that appears next to the popover
- Remove the conditional logic that hides the category selector when `selectedExpenseType === 'loan'`
- Remove the monthly categories placeholder text logic
- Remove the conditional that hides the Product/Labor toggle when loan is selected
- Remove the special validation that allows loan without a category (`selectedExpenseType !== 'loan'`)
- Always show the category selector and always require a category
- Always show the Product/Labor toggle
- Simplify the `onCategorize` prop type from `'product' | 'labor' | 'loan' | 'monthly'` to `'product' | 'labor'`
- Remove the `getMonthlyCategories` import

**File 2: `src/pages/ProjectBudget.tsx`**
- Remove the `totalLoanCosts` state and its data fetch from `loan_payments`
- Remove the `totalMonthlyCosts` memo
- Remove the `grandTotalSpent` calculation
- Remove the "Total Monthly Costs" and "Total Loan Costs" stat cards from Row 1
- Restore Row 1 to: Total Construction Budget, Remaining Construction Budget (and add back 2 useful cards or keep 2 columns)
- Update "Total Spent" to use `totalSpent` directly instead of `grandTotalSpent`
- Update `avgDailySpending` to use `totalSpent` instead of `grandTotalSpent`
- Remove the `selectedExpenseType` filter state
- Remove the "Type" filter dropdown (Construction/Monthly/Loan)
- Remove the expense type badges (Loan/Monthly) from the category column in the expense table
- Remove `selectedExpenseType` from `clearFilters` and `hasActiveFilters`
- Remove the expense type filter logic from the `filteredExpenses` memo
- Remove the `Banknote` icon import if no longer used

**File 3: `src/hooks/useQuickBooks.ts`**
- Simplify `categorizeExpense` parameter type from `'product' | 'labor' | 'loan' | 'monthly'` to `'product' | 'labor'`
- Remove the loan-specific code path (skipping category creation, inserting into `loan_payments`)
- Remove the loan-specific toast messages
- Always require a category value

### What stays untouched
- The `loan_payments` table and data remain in the database (no destructive changes)
- The `MonthlyExpenses` component on ProjectDetail stays (it reads existing data)
- The monthly category enum values stay in the database (harmless, may be useful later)
- The `expense_type` column on the expenses table stays (existing data is preserved)

