# DSCR Loan Detail — Summary Stats Refinement

## Findings (confirmed against the database)

For loan `DSCR — Wales Rental`:
- `original_amount`: $204,000
- `outstanding_balance`: $204,000
- `loan_payments` rows: **0**

So "balance hasn't moved after 2 payments" is actually because **no payments exist in the database** for this loan. The balance card is mathematically correct — it just looks broken because the user expected payments to be there. We need to (a) clean up the redundant cards, (b) replace the misleading "Interest Accrued" stat for amortizing loans, and (c) make the empty payment state obvious.

## Changes

All edits scoped to `src/pages/LoanDetail.tsx`. Behavior for hard-money / private / construction loans is unchanged — only the DSCR + Conventional path is restructured.

### 1. Remove the duplicate "Balance" card (DSCR + Conventional)

For amortizing loans, "Outstanding Balance" (principal) and "Balance" (principal + accrued interest) are confusing duplicates that differ only by the current month's accrued interest. Drop the "Balance" card on these loan types and keep only **Outstanding Balance**.

Hard-money / private / construction loans keep both cards as they exist today (interest genuinely accrues on those).

### 2. Replace "Interest Accrued" with "Next Payment Due" for DSCR + Conventional

"Interest Accrued" is a hard-money concept. On amortizing loans, interest is paid monthly via the P&I payment, so showing it as a standing balance is misleading.

The replacement card shows **Next Payment Due**:
- Calculated from `first_payment_date` plus N monthly increments where N = number of payments already logged.
- If no payments are logged yet, it displays `first_payment_date` (or `start_date + 1 month` as fallback).
- Icon: `CalendarClock`. Color: warning amber if within 7 days, otherwise neutral.

### 3. Empty-state hint on Outstanding Balance card (DSCR + Conventional only)

When `payments.length === 0` and the loan is amortizing, append a small muted line under the value:

> "No payments logged yet"

This makes it immediately obvious to the user *why* the balance equals the original amount, instead of looking like a calculation bug. The existing balance breakdown popover continues to work once payments are added.

### 4. Final card order for DSCR + Conventional

```text
[ Original Amount ] [ Next Payment Due ] [ Outstanding Balance ] [ Monthly Payment ] [ Remaining Term ]
```

Five cards instead of six. Hard-money / private / construction stays at six cards as today.

## Technical Details

- Add `isAmortizing = isTraditional` flag (already computed as `loan.loan_type === 'conventional' || loan.loan_type === 'dscr'`).
- Compute `nextPaymentDue`:
  - `base = loan.first_payment_date ?? addMonths(loan.start_date, 1)`
  - `next = addMonths(base, payments.length)`
  - If `next < today`, advance month-by-month until `>= today`.
- Build `summaryStats` array conditionally: amortizing loans get the trimmed 5-card layout; others keep the existing 6-card layout.
- The existing `gridCols` value already adapts to `summaryStats.length`, so the responsive grid class will follow automatically.
- Empty-state subtitle rendered inside the Outstanding Balance card when `isAmortizing && payments.length === 0`.
- Memory `mem://design/loan-detail-ui-standards` will be updated to record the DSCR/Conventional 5-card layout rule.

## Out of Scope

- Auto-deriving principal/interest split from the amortization schedule on payment entry — flagged separately. Today, the system trusts whatever split is stored on the payment row, which is fine as long as the entry form pre-fills the correct split (we can address this in a follow-up if you want).
