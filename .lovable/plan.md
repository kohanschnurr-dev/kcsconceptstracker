# DSCR / Conventional — Auto-Generated Payment Stream

## Goal

Treat amortizing loans (DSCR + Conventional) as **passive products**. The system auto-derives every monthly payment from the amortization schedule based on elapsed months. The Outstanding Balance, Next Payment Due, and Payments tab all reflect this automatically. Users only intervene when something deviates (extra principal, missed payment, late fee).

## Approach: Virtual payments (no DB writes)

For amortizing loans, we **synthesize** payment rows from the amortization schedule for every month between `first_payment_date` and today. Real `loan_payments` rows are only written when the user manually enters one. When merging, **manual entries override the auto-generated entry for that month**.

This keeps storage clean, makes the loan instantly accurate without a cron job, and lets the user always "take over" a single month.

## Where it plugs in

A single helper, `getEffectivePayments(loan, manualPayments, draws, extensions)`, returns the merged payment array. Every consumer reads from it:

```text
LoanDetail.tsx         → Outstanding Balance, Next Payment Due, breakdown popover
PaymentHistoryTab.tsx  → Auto-generated rows shown with an "Auto" badge, real rows shown normally
LoanStatsRow.tsx       → Portfolio totals stay accurate
LoanCharts.tsx         → Donut & capital stack stay accurate
loans.ts helpers       → effectiveOutstandingBalance() consumes effective payments
```

## Merge rules

1. Build the amortization schedule (existing `buildAmortizationSchedule`) for the loan from `first_payment_date` to today.
2. For each scheduled month, emit a **virtual payment** with `source: 'auto'`, the scheduled `principal_portion`, `interest_portion`, and a synthesized `id` (`auto-<loan_id>-<YYYY-MM>`).
3. For each **real** `loan_payments` row, bucket by year-month of `date`. If a real row exists for that month, drop the virtual one and keep the real row (this is the override).
4. Sort merged result by `date` ascending.

## UI changes

- **Payments tab**: Auto rows render with a subtle `Auto` badge (muted secondary), no Edit/Delete buttons — only an "Override" action that pre-fills the Add Payment modal with that month's amounts. Real rows render as today.
- **Outstanding Balance card**: Drops the "No payments logged yet" hint for amortizing loans, since payments now populate automatically. Keep it for hard-money where it still applies.
- **Next Payment Due**: Now derives from `firstPaymentDate + effectivePayments.length` months — already-passed virtual payments are counted, so the card always points to the *upcoming* due date.
- **Empty edge case**: A brand-new loan whose `first_payment_date` is in the future shows zero payments until that date arrives. The card shows the upcoming first payment date.

## Out of scope (intentional)

- No new database tables, no cron job, no `loan_payments` mass-insert. Pure derivation.
- Auto-Filing (loan-payment ↔ expense linking) continues to operate only on real rows.
- Hard-money / private / construction loans are untouched.

## Technical Details

- New helper file: `src/lib/loanPayments.ts` exporting `getEffectivePayments(loan, payments, draws, extensions)` + `isAutoPayment(payment)`.
- Payment shape extends with optional `source: 'auto' | 'manual' | 'qb'` (already exists on the table) and `is_virtual: boolean` (added only in TS, not the DB).
- `effectiveOutstandingBalance()` in `src/types/loans.ts` is updated to accept the *effective* payments list — its math is unchanged.
- `LoanDetail.tsx` computes `effectivePayments = useMemo(...)` once and passes it everywhere instead of `payments`. Real `payments` are still passed to the override action so we know which months are user-edited.
- `PaymentHistoryTab.tsx` renders the merged list. The `Override` button calls the existing add-payment flow with prefilled values; the real `addPayment.mutate()` then inserts a true row for that month, which the merge automatically substitutes on next render.
- Memory `mem://features/loan-calculator-logic` will be amended to record the auto-payment behavior for amortizing loans.
