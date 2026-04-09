

## Auto-Calculate Outstanding Balance from Amortization Schedule

### Problem
The DSCR loan shows $204,000 outstanding balance — same as origination — even though a month has passed. Currently, the balance only decreases when payments are manually logged. For traditional amortizing loans, the balance should reflect where the loan *should* be based on the amortization schedule and elapsed time.

### Approach
Use the existing `buildAmortizationSchedule` function to find the most recent payment period that has elapsed, and use that row's ending balance as the "effective" outstanding balance. This is purely a display calculation — no database changes needed.

### Changes

**`src/pages/LoanDetail.tsx`** (~5 lines)
- Replace the current `effectiveBalance` calculation (line 117-118) which double-counts principal payments
- Instead: build the amortization schedule, find the last row whose date is on or before today, and use that row's `balance` as `effectiveBalance`
- Fall back to `loan.outstanding_balance` if no amortization rows have elapsed yet

**`src/components/loans/LoanTable.tsx`** (~5 lines)  
- Apply the same logic in the Balance column so the loans list also shows the schedule-derived balance

**`src/components/project/ProjectLoanTab.tsx`** (~3 lines)
- Update the Balance stat card to use the amortization-derived balance instead of `loan.outstanding_balance`

### Logic
```text
schedule = buildAmortizationSchedule(loan)
today = current date
lastElapsed = last row where row.date <= today
effectiveBalance = lastElapsed ? lastElapsed.balance : loan.original_amount
```

### Summary
- 3 files changed, display-only — no DB or migration changes
- Outstanding balance will automatically reflect amortization progress over time

