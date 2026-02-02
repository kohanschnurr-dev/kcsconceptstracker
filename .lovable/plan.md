

## Plan: Filter Payoff Timeline to Show Only Shorter Terms

### Overview

Update the Payoff Timeline comparison to only display term options that are less than or equal to the current loan term. This makes the comparison more relevant by showing how much interest you'd save by paying off early.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Filter `allowedMonths` to only include values <= `loanTermMonths` |

---

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

**Current code (lines 434-444):**
```tsx
// Payoff timeline comparison - limited to 4, 6, 12, 18 month options
const payoffComparison = useMemo(() => {
  const monthlyInt = (loanAmount * (interestRate / 100)) / 12;
  const allowedMonths = [4, 6, 12, 18];
  
  return allowedMonths.map(months => ({
    months,
    interest: monthlyInt * months,
    savings: months < loanTermMonths ? (loanTermMonths - months) * monthlyInt : 0,
  }));
}, [loanAmount, interestRate, loanTermMonths]);
```

**New code:**
```tsx
// Payoff timeline comparison - only show terms up to current loan term
const payoffComparison = useMemo(() => {
  const monthlyInt = (loanAmount * (interestRate / 100)) / 12;
  const allowedMonths = [4, 6, 12, 18].filter(m => m <= loanTermMonths);
  
  return allowedMonths.map(months => ({
    months,
    interest: monthlyInt * months,
    savings: months < loanTermMonths ? (loanTermMonths - months) * monthlyInt : 0,
  }));
}, [loanAmount, interestRate, loanTermMonths]);
```

---

### Behavior Examples

| Loan Term | Visible Options |
|-----------|-----------------|
| 4 months  | 4mo             |
| 6 months  | 4mo, 6mo        |
| 12 months | 4mo, 6mo, 12mo  |
| 18 months | 4mo, 6mo, 12mo, 18mo |
| 9 months (custom) | 4mo, 6mo |
| 24 months (custom) | 4mo, 6mo, 12mo, 18mo |

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | 437 | Add `.filter(m => m <= loanTermMonths)` to allowedMonths |

