

## Plan: Add Second Decimal to Effective APR Display

### Overview

Update the Effective APR display in the Hard Money Loan Calculator to show two decimal places for consistency with the interest rate display.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Update Effective APR display from `toFixed(1)` to `toFixed(2)` |

---

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

**Update Effective APR display (line 316):**

```tsx
// Before
{calculations.effectiveAPR.toFixed(1)}%

// After
{calculations.effectiveAPR.toFixed(2)}%
```

---

### Visual Result

**Before:**
```text
Effective APR
   8.0%
```

**After:**
```text
Effective APR
   8.00%
```

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | 316 | Change `toFixed(1)` to `toFixed(2)` for Effective APR |

