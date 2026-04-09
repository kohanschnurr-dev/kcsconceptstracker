

## Remove Outstanding Balance for Non-Traditional Loans

### Change

**`src/pages/LoanDetail.tsx`** — Conditionally exclude the "Outstanding Balance" stat from the `summaryStats` array when the loan type is NOT `conventional` or `dscr`.

Filter the stat out for non-traditional loans since those use the "Loan Amount" (with draw breakdown) instead:

```typescript
const summaryStats = [
  { label: loanAmountLabel, value: fmt(loanAmountValue), icon: DollarSign, color: 'text-primary bg-primary/10', hasBreakdown: hasLoanBreakdown },
  // Only show Outstanding Balance for conventional/DSCR
  ...(isTraditional ? [{ label: 'Outstanding Balance', value: fmt(loan.outstanding_balance), icon: TrendingDown, color: 'text-warning bg-warning/10' }] : []),
  { label: 'Interest Rate', ... },
  // ...rest unchanged
];
```

### Files Modified
- `src/pages/LoanDetail.tsx` (line ~119)

