

## Fix: Loan Start Date Not Updating Interest Calculations

### Problem

When "To Date" mode is active and you change the Loan Start Date, the interest calculations don't update. This is because changing `loanStartDate` recalculates the display values (`toDateMonths`, `toDateDays`) via `useMemo`, but the actual `loanTermMonths` and `termDaysOverride` state variables that drive the interest math are never updated.

### Root Cause

The `loanStartDate` change updates the memoized `toDateMonths` and `toDateDays`, but nothing pushes those new values back into `loanTermMonths` and `termDaysOverride` -- the state that the `calculations` useMemo depends on.

### Fix

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

Add a `useEffect` that watches `loanStartDate` (and `toDateEndDate`). When `useToDate` is true, it recalculates and sets `loanTermMonths` and `termDaysOverride` from the new loan start date:

```typescript
useEffect(() => {
  if (!useToDate || !loanStartDate) return;
  const newMonths = calculateToDateMonths(loanStartDate, toDateEndDate);
  const start = parseDateString(loanStartDate);
  const newDays = Math.round(
    (toDateEndDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (newMonths > 0) {
    setLoanTermMonths(newMonths);
    setTermDaysOverride(newDays);
  }
}, [loanStartDate, toDateEndDate, useToDate]);
```

This single effect ensures that any time the loan start date or end date changes while in "To Date" mode, the term and day count used for interest math are kept in sync.

### Also fix: Popover ref warning

The console shows "Function components cannot be given refs" from `<Popover>` in this component. The Loan Start Date `<Popover>` at line 570 is not wrapped properly. Wrapping the trigger `<Button>` with `asChild` on `PopoverTrigger` is already done, so this is likely coming from the bare `<Popover>` usage on the "To Date" chevron dropdown (line 451) which doesn't use `asChild` -- but this is cosmetic and won't be addressed here unless desired.

---

### Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Add useEffect to sync term/days when loanStartDate changes in To Date mode |

