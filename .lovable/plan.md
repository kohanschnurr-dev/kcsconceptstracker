

## Hide Amortization Summary Cards for DSCR Loans

### Problem
The Total Interest, Total Principal, and Total Cost of Loan summary boxes above the amortization table feel unnecessary/depressing for DSCR loans given the large numbers over a 30-year term.

### Change

**`src/components/loans/AmortizationTable.tsx`** (lines 53-73)
- Wrap the summary grid `<div>` in a condition: only render when `loan.loan_type !== 'dscr'`
- The amortization table itself and CSV export remain unchanged

One file, ~2 lines changed.

