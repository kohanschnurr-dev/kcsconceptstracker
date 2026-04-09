

## Auto-File Loan Expenses into Loan Payments

### What
When an expense with `cost_type = 'loan'` is created or detected for a project, automatically file it as a loan payment. If the project has multiple linked loans, prompt the user to choose which loan. If the expense amount matches a loan's monthly payment, auto-recommend that loan.

### Changes

**1. New component: `src/components/project/LoanPaymentAssignDialog.tsx`**
- A dialog that appears when a loan-type expense is created/imported for a project with linked loans
- If only one loan is linked, auto-assign without prompting
- If multiple loans exist, show a selection dialog with each loan listed
- For each loan, compare the expense amount against `loan.monthly_payment` (or calculated monthly). If they match (within $0.50 tolerance), display a "Recommended" badge next to that loan
- On selection, call `addPayment` from `useLoanDetail` to insert a `loan_payments` row linked to that loan, with `expense_id` set to the expense ID
- Include a "Skip" option to not assign

**2. Modify `src/pages/ProjectBudget.tsx`** (expense creation flow)
- After an expense is successfully created with `cost_type === 'loan'`, trigger the loan assignment dialog
- Pass the new expense's ID, amount, date, and the project ID to the dialog
- The dialog fetches linked loans for the project and handles assignment

**3. Modify `src/components/QuickExpenseModal.tsx`**
- Same trigger: after successful expense insert with `cost_type === 'loan'`, open the loan assignment dialog
- Pass expense details to the dialog

**4. Backend logic for auto-recommendation**
- In the dialog component, for each linked loan:
  - Calculate `monthlyPayment = loan.monthly_payment ?? calcMonthlyPayment(...)`
  - If `Math.abs(expenseAmount - monthlyPayment) < 0.50`, mark as recommended
  - Sort recommended loans first
- Pre-select the recommended loan if there's exactly one match

### Technical Details

- `loan_payments` table already has `expense_id`, `project_id`, `user_id`, `loan_id` columns -- perfect for linking
- The dialog will use `useLoans()` to get linked loans for the project, then insert into `loan_payments` via `supabase.from('loan_payments').insert()`
- Payment row will populate: `loan_id`, `amount`, `date` (from expense), `notes` (auto-generated: "Auto-filed from expense"), `expense_id`, `project_id`, `user_id`
- For interest-only loans, the full amount goes to `interest_portion`; otherwise split is left null for manual adjustment

### UI Flow
```text
User creates expense with cost_type = "Loan"
  └─ 1 linked loan? → Auto-assign, show toast "Payment logged to [Loan Name]"
  └─ 2+ linked loans? → Show dialog:
       ┌──────────────────────────────────────┐
       │  Assign to Loan Payment              │
       │                                      │
       │  ○ Boomerang - $2,113/mo ⭐ Match    │
       │  ○ Second Loan - $1,500/mo           │
       │                                      │
       │  [Skip]              [Assign]        │
       └──────────────────────────────────────┘
  └─ 0 linked loans? → No action
```

