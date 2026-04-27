## Goal

Make the **Interest Accrued** column in the Loans table show the **same total interest** the loan's detail page shows in its summary card — not just the simple-interest figure on the original amount.

## Current behavior (the bug)

`LoanTable.tsx` always calls `accruedInterestThroughToday(loan, payments)`, which:
- Starts from `loan.original_amount` only
- Ignores funded **draws** (so construction / draw-based hard-money loans understate accrued interest)
- Returns `—` for amortizing types (DSCR / conventional / HELOC / portfolio / seller financing) instead of their scheduled accrued interest

`LoanDetail.tsx` already computes a richer figure (`combinedInterest`) that:
- Uses payment-aware accrual for short-term/interest-only loans
- Adds draw-based interest from `buildDrawInterestSchedule` when `loan.has_draws`
- Falls back to amortization-schedule interest through today for amortizing loans
- Subtracts interest already paid

The table should mirror that.

## Fix

### 1. Add a shared helper `totalAccruedInterest(loan, payments, draws, extensions?)` in `src/types/loans.ts`

It will encapsulate the same logic currently inlined in `LoanDetail.tsx` (lines 91–143) so both places stay in sync:

```text
extensionMonths = sum of extensions (or 0 if not provided)
schedule        = buildAmortizationSchedule(loan, extensionMonths)
drawInterest    = loan.has_draws ? buildDrawInterestSchedule(loan, draws, extensionMonths) : null
interestPaid    = sum(payment.interest_portion)

if loan.loan_type ∈ ACCRUES_INTEREST_TYPES:
    base = accruedInterestThroughToday(loan, payments)
else:
    base = max(0, sum(schedule rows where row.date <= today).interest − interestPaid)

if drawInterest:
    return max(0, base + drawInterest.totalInterest − interestPaid)
return base
```

Refactor `LoanDetail.tsx` to call this helper so the two views are guaranteed to match.

### 2. Update `LoanTable.tsx`

- Extend the existing `loan_payments` query to also fetch the `interest_portion` (already selected) and pull `loan_draws` for the visible loan IDs (lightweight: `id, loan_id, draw_amount, draw_number, status, date_funded, expected_date, interest_rate_override, fee_amount, fee_percentage, milestone_name`).
- Build a `drawsByLoan` map mirroring `paymentsByLoan`.
- Replace the cell:
  ```text
  ACCRUES_INTEREST_TYPES.includes(...) ? accruedInterestThroughToday(...) : '—'
  ```
  with:
  ```text
  totalAccruedInterest(loan, paymentsByLoan[loan.id] ?? [], drawsByLoan[loan.id] ?? [])
  ```
  (no more `—` for amortizing loans — they'll show the scheduled interest accrued through today, matching the detail page)

### 3. (Optional, same call site) `LoanCharts.tsx`

`LoanCharts.tsx` line 106–107 uses the same simple `accruedInterestThroughToday`. Switching it to `totalAccruedInterest` is a one-line change and keeps the dashboard donut/bar consistent. I'll include this swap so all three surfaces (table, charts, detail) report identical numbers.

## Files touched

- `src/types/loans.ts` — add `totalAccruedInterest` helper
- `src/pages/LoanDetail.tsx` — use the helper for `combinedInterest`
- `src/components/loans/LoanTable.tsx` — fetch draws, swap to helper, drop the `—` branch
- `src/components/loans/LoanCharts.tsx` — swap to helper

## Result

The "Interest Accrued" value in the loans table for any loan will equal the "Interest Accrued" tile shown when you open that loan — including draw-based accrual for construction loans.
