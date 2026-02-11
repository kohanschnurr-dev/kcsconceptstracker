

## Fix Points/Origination and Closing Costs Not Persisting

### Root Cause

In `src/pages/ProjectDetail.tsx` (lines 721-724), the `||` operator is used for fallback values. Since `0` is falsy in JavaScript, when you save points as `0`, the expression `hm_points || 3` evaluates to `3` on the next load. Same issue affects all the numeric loan fields.

### Fix

**File: `src/pages/ProjectDetail.tsx`** (lines 721-724)

Replace `||` with `??` (nullish coalescing) so that `0` values are preserved and only `null`/`undefined` trigger the fallback:

```
Before:
  initialInterestRate={(project as any).hm_interest_rate || 12}
  initialLoanTermMonths={(project as any).hm_loan_term_months || 6}
  initialPoints={(project as any).hm_points || 3}
  initialClosingCosts={(project as any).hm_closing_costs || 0}

After:
  initialInterestRate={(project as any).hm_interest_rate ?? 12}
  initialLoanTermMonths={(project as any).hm_loan_term_months ?? 6}
  initialPoints={(project as any).hm_points ?? 3}
  initialClosingCosts={(project as any).hm_closing_costs ?? 0}
```

This is a one-file, four-line fix. The save logic already works correctly -- it's only the reload that was discarding `0` values.

