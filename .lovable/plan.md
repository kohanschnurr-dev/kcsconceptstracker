## Mark Paid Off — Reconciliation Dialog

Today, clicking "Mark Paid Off" silently sets `status='paid_off'` and `outstanding_balance=0`. Result (visible in the screenshot): the loan shows **Paid Off** but **Balance $114,888**, **Interest Accrued $4,888**, and zero payments — books are out of sync.

### Goal
When a user marks a loan paid off, surface a clean reconciliation modal that accounts for the remaining principal + accrued interest by writing a real payoff payment, so all stats (Balance, Interest Paid, Payment History, Total Cost) stay in line.

### New component: `MarkPaidOffDialog`
File: `src/components/loans/MarkPaidOffDialog.tsx`

Pre-fills from current loan state:
- **Payoff Date** — date picker, defaults to today
- **Remaining Principal** — `effectiveBalance` (read-only, with edit toggle)
- **Accrued Interest** — `liveAccruedInterest` (read-only, with edit toggle)
- **Late Fee / Other** — optional
- **Total Payoff** — auto-sum, big bold number
- **Notes** — optional ("Refi proceeds", "Sale at closing", etc.)

Three action choices (radio):
1. **Log final payoff payment** (default, recommended) — creates a `loan_payments` row and sets status to `paid_off`. This zeroes principal AND records interest.
2. **Mark paid off without recording payment** — keeps current "silent" behavior, but with an inline warning: *"Balance and interest will not appear in payment history. Use only if already tracked elsewhere."*
3. **Cancel**

If principal + interest = 0 (already fully paid via prior payments), skip the dialog entirely and just flip status — no friction.

### Wiring in `LoanDetail.tsx`
Replace the current `handleMarkPaidOff` with a state-controlled dialog open. On confirm with option 1:
```ts
addPayment.mutate({
  payment_date: payoffDate,
  amount: principal + interest + lateFee,
  principal_portion: principal,
  interest_portion: interest,
  late_fee: lateFee || null,
  notes: notes || 'Loan payoff',
});
// after success:
updateLoan.mutate({ id: loan.id, status: 'paid_off', outstanding_balance: 0 });
```

The existing `addPayment` mutation already adjusts `outstanding_balance` by principal delta, so the second `updateLoan` call only needs to set status — but we'll explicitly set balance to 0 as a safety net.

### Empty / edge-case handling
- **No accrued interest, no balance** → confirm-only toast, no payoff form fields shown.
- **Has draws but loan_type doesn't accrue** → only show principal field.
- **Amortizing loan (DSCR/conventional) with auto-derived payments** → use `effectiveBalance` (which already nets auto rows) so we don't double-count.
- All numbers use the same `fmt()` and breakdown logic already in `LoanDetail.tsx` so the dialog's totals match the header cards exactly.

### Files touched
- **NEW** `src/components/loans/MarkPaidOffDialog.tsx`
- `src/pages/LoanDetail.tsx` — replace `handleMarkPaidOff`, mount dialog, pass `addPayment` + `updateLoan`.

No DB migration needed — uses existing `loan_payments` insert path.
