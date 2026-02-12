
## Fix Monthly and Loan Expense Import from QuickBooks

### Problem
When you select "Monthly" or "Loan" in the QuickBooks pending queue and try to import, it fails because:
- **Monthly**: The monthly category values (water, gas, electric, insurance, etc.) are not valid entries in the database's budget category list. The system tries to create a project category with an invalid value and the database rejects it.
- **Loan**: Loans work partially but may have edge cases where the expense doesn't properly clear from the queue.

### Solution

**1. Add monthly category values to the database enum** (database migration)

Add these missing values to the `budget_category` enum so monthly costs can be properly stored:
- water, gas, electric, insurance, property_tax, lawn_care, pool_maintenance, internet_cable, trash_recycling, security_alarm

(Some like `pest_control` and `hoa` already exist in the enum.)

**2. Fix the categorize flow in `src/hooks/useQuickBooks.ts`**

For **monthly** expenses: The current code path already works correctly once the enum values exist -- it finds/creates a `project_categories` row and inserts an expense with `expense_type: 'monthly'`. No code changes needed for this path.

For **loan** expenses: The code already handles loans by skipping category creation and inserting into `loan_payments`. However, ensure the QB expense record gets properly marked as imported and cleared from the pending list. Review and fix any issues where the QB record update might fail silently.

**3. Verify the full flow works end-to-end**

After the enum update:
- Monthly: Select project, pick monthly category (e.g. Insurance), click checkmark. Expense is created with `expense_type: 'monthly'`, appears in the feed with a teal "Monthly" badge, and contributes to "Total Monthly Costs."
- Loan: Select project, click checkmark (no category needed). Expense is created with `expense_type: 'loan'`, a `loan_payments` record is inserted, appears in feed with a blue "Loan" badge, and contributes to "Total Loan Costs."

### Technical Details

**Database migration**: Single `ALTER TYPE` statement to add the new enum values.

```text
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'water';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'gas';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'electric';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'insurance';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'property_tax';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'lawn_care';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'pool_maintenance';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'internet_cable';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'trash_recycling';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'security_alarm';
```

**File: `src/hooks/useQuickBooks.ts`** -- No major changes needed once enum is fixed. Will verify the loan path clears the pending queue correctly.

**File: `src/pages/ProjectBudget.tsx`** -- Already has the badge rendering and stat cards from the previous changes. Monthly and loan expenses will automatically flow into the correct totals.

### Summary
- One database migration to add monthly cost values to the budget category enum
- The existing code already handles monthly/loan routing correctly -- it just couldn't save because the DB rejected the category values
- No UI changes needed -- badges and stat cards are already in place
