

## Change Loan Term from Weeks to Months

### What Changes

Switch the loan term unit from weeks to months. Default becomes 360 months (30 years). Rename all internal state from `loanTermWeeks` to `loanTermMonths`.

### Technical Details

**File: `src/components/project/CashFlowCalculator.tsx`**

1. Rename `loanTermWeeks` state to `loanTermMonths` throughout (all 26 references)
2. Line 56: Change init from `Math.round((initialLoanTermYears ?? 30) * 52.143)` to `Math.round((initialLoanTermYears ?? 30) * 12)` -- default 360
3. Line 103: Same change in the sync effect
4. Line 129: Save conversion: `loan_term_years: loanTermMonths / 12` (instead of `/52.143`)
5. Line 157: Amortization simplifies: `numberOfPayments = loanTermMonths` (no conversion needed -- already in months)
6. Line 297: Label changes from "Loan Term (weeks)" to "Loan Term (months)"
7. Line 303: Placeholder changes from "1560" to "360"

