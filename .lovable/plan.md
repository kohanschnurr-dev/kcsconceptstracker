

## Fix Daily Interest Accrual Calculation

### Problem
The interest calculations use monthly granularity (`monthlyPayment * loanTermMonths`). When a fractional "To Date" term like 1.4 months (43 days) is selected, the total interest should accrue on a per-day basis so each day is properly accounted for. Currently it multiplies a monthly payment by a fractional month count, which can produce slightly off results and doesn't clearly show daily accrual.

### Changes in `src/components/project/HardMoneyLoanCalculator.tsx`

**1. Add a `dailyInterest` value to the `calculations` memo**

Calculate the daily interest rate from the annual rate and use it for precise accrual:

```typescript
const dailyRate = interestRate / 100 / 365;
const dailyInterest = loanAmount * dailyRate;
```

For interest-only loans, compute `totalInterest` using days instead of months:

```typescript
// Convert loanTermMonths to days for precise calculation
const termDays = Math.round(loanTermMonths * 30.44);
totalInterest = dailyInterest * termDays;
```

This ensures that a 1.4-month (43-day) term accrues exactly 43 days of interest, not a rounded monthly approximation.

**2. Add daily interest to the results display**

Add a small line in the KPI cards or summary section showing the daily interest cost (e.g., "$XX.XX / day") so the user can see the per-day accrual at a glance.

**3. Update the Payoff Timeline to use daily calculation**

Change the `payoffComparison` memo to also compute interest using `dailyRate * (months * 30.44)` instead of `monthlyInt * months`, keeping everything consistent with daily accrual.

**4. Include the current "To Date" term in the Payoff Timeline**

If `loanTermMonths` is fractional (i.e., from "To Date"), add it as an entry in the payoff timeline so the user can see the interest cost at their current/selected date alongside the standard month milestones.

### Summary of Results Display Updates
- Monthly Payment KPI: unchanged (still shows what one full month costs)
- Total Interest: recalculated using daily accrual for the exact term
- New: "Daily Interest" line showing per-day cost (e.g., "$32.88 / day")
- Payoff Timeline: uses daily math, includes the current fractional term if applicable
