

## Plan: Remove "Save" Display from Payoff Timeline

### Overview

Remove the savings indicator ("Save $X") from each row in the Payoff Timeline to reduce visual clutter. Only the interest amount will be displayed.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Remove the savings display from payoff timeline rows |

---

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

**Current code (lines 878-886):**
```tsx
<div className="flex items-center gap-4 text-sm">
  <span className="font-mono">{formatCurrency(row.interest)} int</span>
  {row.savings > 0 && (
    <span className="text-success font-mono flex items-center gap-1">
      <TrendingDown className="h-3 w-3" />
      Save {formatCurrency(row.savings)}
    </span>
  )}
</div>
```

**New code:**
```tsx
<span className="font-mono text-sm">{formatCurrency(row.interest)} int</span>
```

---

### Visual Result

**Before:**
```
If sold at 4 mo:     $2,977.33 int    ↘ Save $1,488.67
If sold at 6 mo:                      $4,466.00 int
```

**After:**
```
If sold at 4 mo:     $2,977.33 int
If sold at 6 mo:     $4,466.00 int
```

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | 878-886 | Simplify to show only interest amount |

