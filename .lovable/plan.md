
## Fix "To Date" Auto-Selection Being Overridden by Starred Preset

### Problem
The "To Date" value is applied on mount via `useEffect`, but the starred preset loads asynchronously from the database and overwrites `loanTermMonths` afterward (setting it to 360).

### Solution
Move the "To Date" auto-application to run **after** the preset has loaded, not before.

**In `src/components/project/HardMoneyLoanCalculator.tsx`:**

1. Remove the current `toDateAppliedRef` / `useEffect` block (lines 145-152) that tries to apply "To Date" on mount.

2. In the preset-loading effect (around line 216-224), after loading a default preset (or if none exists), override `loanTermMonths` with the "To Date" value when available:
   - After line 224 (end of `if (defaultPreset)` block), and also in the else branch: if `toDateMonths > 0`, call `setLoanTermMonths(toDateMonths)`.

3. Also handle the no-preset case: if no default preset is found AND `toDateMonths` is available, still apply it.

The key change: "To Date" always wins as the initial term selection, regardless of whether a starred preset loaded other values (interest rate, points, etc. still come from the preset).

### Technical Detail

```typescript
// After preset loading logic (line ~224):
// Always override term with To Date when available
const currentToDate = projectStartDate ? calculateToDateMonths(projectStartDate) : null;
if (currentToDate && currentToDate > 0) {
  setLoanTermMonths(currentToDate);
}
```

This ensures "To Date" is applied last, after any preset has loaded its values.
