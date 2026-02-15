

## Fix Loan Amount Persistence + Redesign Interest Rate Input

### Problem 1: Loan Amount slider value not persisting
The `useEffect` at line 181-188 resets `loanAmount` from props whenever dependencies change, including `editablePurchasePrice`. After saving and query invalidation, there's a timing issue where the effect may reset state before the updated prop arrives. Additionally, the preset-fetch effect (lines 191-243) re-runs on `editablePurchasePrice` changes and can interfere.

**Fix**: Add a `hasUserEdited` ref to track when the user manually changes the loan amount. Skip the reset effect when the user has actively edited values. Also ensure `handleSave` properly awaits the invalidation before allowing state resets.

### Problem 2: Remove interest rate slider, compact layout
Remove the `Slider` component for Annual Interest Rate. Keep only the text input with the `%` icon. Place "Annual Interest Rate" and "Loan Term (Months)" side-by-side on the same row using a 2-column grid.

### Changes to `src/components/project/HardMoneyLoanCalculator.tsx`

1. **Fix loan amount persistence**:
   - Wrap the reset `useEffect` (line 181-188) so it only runs when props genuinely change from the server (compare against previous values), not on every render cycle
   - Use a ref to track "dirty" state — once the user interacts with the slider/input, skip resets until a successful save completes

2. **Remove Annual Interest Rate slider** (lines 738-744):
   - Delete the `<Slider>` component for interest rate
   - Keep the `<Input>` field with `%` icon prefix

3. **Same-row layout for Interest Rate + Loan Term**:
   - Wrap the "Annual Interest Rate" and "Loan Term (Months)" sections in a `grid grid-cols-2 gap-4` container
   - Make the interest rate input more compact (remove the separate `%` icon row, integrate it as a prefix like the dollar sign fields)

### Files to Change
- **`src/components/project/HardMoneyLoanCalculator.tsx`**
  - Add dirty-tracking ref for loan amount persistence
  - Remove interest rate Slider component
  - Restructure interest rate input to be compact with % prefix
  - Wrap interest rate + loan term in a 2-column grid row
