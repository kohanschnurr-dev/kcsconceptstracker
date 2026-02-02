

## Plan: Update Interest Rate Slider Range

### Overview

Change the Annual Interest Rate slider range from 8%-18% to 2%-15% to give users more flexibility in modeling lower interest rates.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Update slider min/max from 8-18 to 2-15 |

---

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

**Update slider props (lines 226-227):**

```tsx
// Before
<Slider
  value={[interestRate]}
  onValueChange={([val]) => setInterestRate(val)}
  min={8}
  max={18}
  step={0.25}
/>

// After
<Slider
  value={[interestRate]}
  onValueChange={([val]) => setInterestRate(val)}
  min={2}
  max={15}
  step={0.25}
/>
```

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | 226-227 | Change `min={8}` to `min={2}` and `max={18}` to `max={15}` |

