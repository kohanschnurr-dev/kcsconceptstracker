

## Fix "Interest Paid" Stat to Calculate from Amortization Schedule

### Problem
The "Interest Paid" summary stat currently sums `interest_portion` from manual payment records, which shows $0 when no payments have been logged. Instead, it should calculate how much interest has accrued based on the current date against the amortization schedule — showing what *should* have been paid by now.

### Solution
Replace the simple `payments.reduce()` logic with a calculation that:
1. Builds the amortization schedule (already available via `buildAmortizationSchedule`)
2. Filters rows where the payment date is on or before today
3. Sums the `interest` column from those elapsed rows
4. For draw-based loans, pro-rates the draw interest schedule similarly by elapsed time

### Changes

**`src/pages/LoanDetail.tsx`**
- Replace `totalInterestPaid` calculation:
  - Build the amortization schedule with extension months
  - Filter schedule rows where `row.date <= today`
  - Sum the `interest` from those rows
  - For draw-based loans, use `drawInterest` schedule filtered by current date
- Update the stat card label to "Interest Owed" or keep "Interest Paid" but show the schedule-derived amount
- The stat card click behavior is not currently implemented, so no changes needed there

### Technical Detail
```typescript
// Calculate interest accrued through today based on amortization schedule
const extensionMonths = extensions.reduce((sum, ext) => {
  const from = new Date(ext.extended_from);
  const to = new Date(ext.extended_to);
  return sum + Math.max((to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()), 0);
}, 0);

const schedule = buildAmortizationSchedule(loan, extensionMonths);
const todayStr = new Date().toISOString().split('T')[0];
const interestAccrued = schedule
  .filter(row => row.date <= todayStr)
  .reduce((sum, row) => sum + row.interest, 0);
```

This replaces the current `payments.reduce((s, p) => s + (p.interest_portion ?? 0), 0)` approach that only works if users manually log interest portions on each payment.

