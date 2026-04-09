

## Dynamically Compute Outstanding Balance from Payments

### Problem
The "Outstanding Balance" displayed on the loan detail page reads directly from `loan.outstanding_balance` in the database, which is never updated when payments are logged. So even after recording a payment, the balance stays at the original amount.

### Solution
Compute the outstanding balance dynamically on the client side:

```
effective_balance = loan.outstanding_balance - sum(principal_portion of all payments)
```

This ensures the balance reflects logged payments without needing a database trigger.

### Changes

**`src/pages/LoanDetail.tsx`**
1. After payments are loaded, compute `totalPrincipalPaid = payments.reduce((s, p) => s + (p.principal_portion ?? 0), 0)`
2. Compute `effectiveBalance = loan.outstanding_balance - totalPrincipalPaid`
3. Replace all references to `loan.outstanding_balance` with `effectiveBalance` in:
   - The "Outstanding Balance" summary stat card
   - Any other display of balance on this page

**`src/components/loans/LoanTable.tsx`**
- The loans list page also shows balance. Since payments aren't loaded there, we have two options:
  - Option A: Update `outstanding_balance` in the DB when a payment is added (more correct long-term)
  - Option B: Keep the table showing the DB value for now, fix detail page first

I recommend **both**: update the DB balance when logging a payment (in `useLoans.ts` `addPayment`) AND compute it dynamically on the detail page for immediate accuracy.

**`src/hooks/useLoans.ts`**
- In the `addPayment` mutation's `onSuccess`, also update the loan's `outstanding_balance` by subtracting the `principal_portion` from the current balance. This keeps the DB in sync for the loans list page.

### Summary
- 3 files changed: `LoanDetail.tsx`, `useLoans.ts`, `LoanTable.tsx`
- Detail page shows computed balance immediately
- DB balance updates on payment add/delete for consistency across pages

