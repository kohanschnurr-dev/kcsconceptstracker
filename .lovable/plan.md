

## Remove Original Amount from Total Cost of Loan

### Change

**`src/pages/LoanDetail.tsx`** (line 90)
- Remove `loan.original_amount` from the `totalCost` formula so it only sums: interest accrued + origination fee + other closing costs + extension fees.

```typescript
// Before
const totalCost = loan.original_amount + totalScheduleInterest + (loan.origination_fee_dollars ?? 0) + (loan.other_closing_costs ?? 0) + totalExtensionFees;

// After
const totalCost = totalScheduleInterest + (loan.origination_fee_dollars ?? 0) + (loan.other_closing_costs ?? 0) + totalExtensionFees;
```

