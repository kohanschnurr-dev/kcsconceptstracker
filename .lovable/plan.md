## Plan: Break out P&I in Cash Flow Analysis

In `src/components/budget/RentalAnalysis.tsx`, replace the single "Mortgage P&I" row in the Monthly Expenses column with three rows showing the **first-year averages** of an amortization schedule:

- **Principal (Yr 1 avg)** — average monthly principal across payments 1–12
- **Interest (Yr 1 avg)** — average monthly interest across payments 1–12
- **Total P&I** — sum (= existing `monthlyPI`), kept as a bold subtotal row so the cash-flow math stays unchanged

### Calculation

Standard amortization, no new inputs:
```
balance = refiLoanAmount
for month 1..12:
  interest_m = balance * monthlyRate
  principal_m = monthlyPI - interest_m
  balance -= principal_m
year1Interest = sum(interest_m)
year1Principal = sum(principal_m)
avgInterest = year1Interest / 12
avgPrincipal = year1Principal / 12
```

Only render the breakdown when `refiLoanAmount > 0` (same guard as today). Interest shown in `text-destructive`, principal in default, total in `font-medium` with a top border — matches the styling pattern already used in the Income column.

### Scope

- Single file: `src/components/budget/RentalAnalysis.tsx`
- Presentation-only; no changes to cash flow, NOI, or returns math
- No new props, no schema changes
