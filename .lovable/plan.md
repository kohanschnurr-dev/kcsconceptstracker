## Fix Balance for draw loans (include funded draws as principal)

### Problem
On the loan in the screenshot:
- Original amount: **$50,000**
- Funded draws: **$60,000** ($40k Cosmetics + $20k Monthly Costs)
- Loan Amount card (correctly): **$110,000** (original + funded draws)
- Balance card: **$55,445** ← wrong

The Balance ignores funded draws entirely. It uses `loan.outstanding_balance` from the database, which only stores the original $50k. So Balance = $50,000 + $5,445 interest = $55,445, when it should be **$110,000 + $5,445 = $115,445** (no payments made yet, so full disbursed principal is still owed).

### Root cause
`src/pages/LoanDetail.tsx` (~line 135):
```ts
const effectiveBalance = payments.length > 0
  ? paymentDerivedBalance              // uses original_amount, ignores draws
  : (lastElapsedRow ? lastElapsedRow.balance : loan.outstanding_balance);
```

Two issues for draw loans:
1. `effectiveOutstandingBalance(loan, payments)` in `src/types/loans.ts` computes from `loan.original_amount − principalPaid` and never adds funded draws.
2. The fallback `loan.outstanding_balance` is the stored value which also excludes draws.

### Fix
**`src/pages/LoanDetail.tsx`** (~line 132-137)
Anchor the remaining-principal calculation to `loanAmountValue` (the same number shown on the Loan Amount card, which already correctly includes funded draws for non-traditional draw loans):

```ts
const principalPaid = payments.reduce((s, p) => s + (p.principal_portion ?? 0), 0);
const effectiveBalance = Math.max(0, loanAmountValue - principalPaid);
```

This single source of truth ensures the Balance always equals what the user sees on the Loan Amount card minus what they've paid down. Drop the now-unused schedule fallback for this stat (the amortization tab already shows scheduled paydown separately).

### Result
- Screenshot loan with no payments: Balance = $110,000 + $5,445 = **$115,445** ✓
- Loans with payments: Balance correctly subtracts principal portions from the full disbursed amount.
- Traditional (non-draw) loans: behavior unchanged because `loanAmountValue === loan.original_amount`.