
## Fix LTV Not Persisting on Save

### Problem
When you adjust the LTV slider (which changes the Loan Amount) and click Save, the value resets back to 75% of the purchase price. This happens because the code uses JavaScript's `||` operator for the fallback, which treats `0` and any falsy value as "not set" and defaults to 75%.

Additionally, the component's `useEffect` re-runs after save and can reset the loan amount before the parent has refetched the updated data from the database.

### Fix

**`src/components/project/HardMoneyLoanCalculator.tsx`**

1. **Line 115**: Change `initialLoanAmount || (editablePurchasePrice * 0.75)` to use `??` (nullish coalescing) so that a saved value of any number (including values that might be 0 in edge cases) is respected:
   ```typescript
   const defaultLoanAmount = initialLoanAmount ?? (editablePurchasePrice * 0.75);
   ```

2. **Line 181**: Same fix in the `useEffect` that syncs props to state:
   ```typescript
   setLoanAmount(initialLoanAmount ?? (editablePurchasePrice * 0.75));
   ```

3. **In `handleSave`**: After a successful save, invalidate/refetch the project data so the parent passes back the correct `initialLoanAmount` prop immediately, preventing the effect from reverting state.

### Why This Fixes It
- The `||` operator treats `0` as falsy, so even valid saved values can be overwritten by the 75% default
- Using `??` only falls back when the value is `null` or `undefined` (truly not set)
- Refetching after save ensures the parent component has the latest data, so the `useEffect` won't reset to stale values

### Files to Change
- **`src/components/project/HardMoneyLoanCalculator.tsx`** -- fix `||` to `??` on lines 115 and 181, add query invalidation after successful save
