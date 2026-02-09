

## Loan Expenses: Skip Category + Dashboard Interest Card

### Overview

Two changes:
1. When "Loan" is selected on a QuickBooks expense, **hide the category dropdown entirely** (loans don't affect the project budget, so no category is needed). Also skip creating/finding a `project_category` record -- the expense gets imported with `category_id = null`.
2. Add a **"Total Interest Paid" stat card** to the dashboard that sums all loan payments across projects.

### Changes

**1. `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**

- When `selectedExpenseType === 'loan'`, hide the category `Select` dropdown completely (not just disable it)
- Update `handleSingleCategorize` to pass empty string for category when loan is selected, since `useQuickBooks` already handles this

**2. `src/hooks/useQuickBooks.ts`**

- Update `categorizeExpense` so that when `expenseType === 'loan'`:
  - Skip the category lookup/creation entirely (`categoryId` stays `null`)
  - Insert expense with `category_id: null` 
  - Still insert into `loan_payments` as it does now
- Update `handleSingleCategorize` validation: already allows no category for loans (line 315), so no change needed there

**3. `src/pages/Index.tsx` -- Add Interest Card to Dashboard**

- Fetch from `loan_payments` table on mount
- Sum all payment amounts to get "Total Interest Paid" (or "Total Loan Payments")
- Add a new `StatCard` to the stats grid with a `Landmark` icon showing the total
- This gives quick visibility into how much is going toward loans across all projects

### Technical Details

Category skip in `useQuickBooks.ts`:
```typescript
// When loan, skip category entirely
if (expenseType === 'loan') {
  categoryId = null;
  // Skip the find-or-create category block
}
```

Dashboard fetch:
```typescript
const { data: loanPayments } = await supabase
  .from('loan_payments')
  .select('amount');
const totalLoanPayments = (loanPayments || [])
  .reduce((sum, p) => sum + Number(p.amount), 0);
```

No database changes needed.
