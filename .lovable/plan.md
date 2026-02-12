

## Enable Loan Tracking for Rental Projects

### Problem
1. **Loan tab is hidden for rentals** -- Rental properties can have mortgages/loans, but the Loan tab is filtered out for rental projects.
2. **Loan import fails with error** -- When marking a QB expense as "Loan," the code tries to insert into the `expenses` table with `category_id: null`, but that column is NOT NULL, causing "Failed to create expense record."
3. **Budget isolation** -- Loan payments should NOT count toward the project budget (construction-only), which is already the intended behavior since loans skip category assignment.

### Solution

**1. Database migration -- make `category_id` nullable**

The `expenses.category_id` column is currently `NOT NULL`. Change it to nullable so loan-type expenses can be stored without a budget category. This is the root cause of the error in the screenshot.

**2. Show Loan tab for rental projects**

Remove the filter in `ProjectDetail.tsx` that hides the Loan tab when `project_type === 'rental'`. Rentals need loan tracking just as much as fix-and-flips.

**3. No other changes needed**

The existing logic already:
- Skips category selection when "Loan" is chosen in the QB queue
- Inserts into `loan_payments` table for loan-type expenses
- Sets `category_id: null` for loans (which will now work after the migration)
- Excludes null-category expenses from budget calculations

### Technical Details

**Database migration:**
```sql
ALTER TABLE public.expenses ALTER COLUMN category_id DROP NOT NULL;
```

**File: `src/pages/ProjectDetail.tsx`**
- Remove the two places where `loan` is filtered out of the tab order for rental projects (lines ~386-387 and ~396)
- The Loan tab and LoanPayments component will then render for all project types

**Two files touched, one migration. The loan import flow will work end-to-end after this.**

