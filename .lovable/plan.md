

## Fix Cash Invested Calculation for Regular Loan Mode

### Problem
In the "Regular" (non-refi) rental analysis, Cash Invested always equals the full cost basis (Purchase + Rehab) because the loan amount is only subtracted when `refiEnabled` is true. However, the mortgage P&I IS being calculated from the loan amount in both modes, meaning the loan exists -- it just is not factored into the cash invested calculation.

This causes Cash Invested to show the full cost basis instead of the reduced amount after the loan, and Cash-on-Cash return to be incorrect.

### Solution
Always subtract the loan amount from the cost basis when calculating Cash Invested, regardless of whether "refi" mode is toggled. The points cost should also always be included if applicable.

### Technical Details

**File: `src/components/budget/RentalAnalysis.tsx`**

Replace lines 56-58:

```tsx
const totalCashInvested = rentalFields.refiEnabled
  ? Math.max(0, totalCostBasis + refiPointsCost - refiLoanAmount)
  : totalCostBasis;
```

With:

```tsx
const totalCashInvested = Math.max(0, totalCostBasis + refiPointsCost - refiLoanAmount);
```

This ensures the loan amount is always deducted from the cost basis when computing cash invested, whether in Regular or Refi mode. The `refiLoanAmount` already defaults to 0 when no loan is configured, so the math remains correct when no loan exists.

