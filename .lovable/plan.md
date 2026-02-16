

## Add Loan-to-Value / Loan-to-Purchase Toggle

### Overview
Add a small toggle button next to the "Loan-to-Value" label in the Loan section that lets you switch between basing the loan calculation on ARV or Purchase Price.

### How It Works
- Default: "Loan-to-Value" (LTV) -- percentage of ARV (current behavior)
- Toggle to: "Loan-to-Purchase" (LTP) -- percentage of Purchase Price
- The slider, computed loan amount, and all downstream calculations update accordingly
- A small button (similar to the existing Points % / $ toggle) switches between modes

### Technical Details

**1. Add new field to `RentalFieldValues` interface (`RentalFields.tsx`)**
- Add `refiLtvBase: 'arv' | 'purchase'` to the interface

**2. Update `RentalFields` component (`RentalFields.tsx`)**
- Accept `purchasePrice: number` as a new prop alongside `arv`
- Determine the base value: `arv` or `purchasePrice` depending on `values.refiLtvBase`
- Add a toggle button next to the label showing "ARV" or "PP"
- Update slider `onValueChange` to compute loan from the selected base
- Update the `computedLoanAmount` calculation to use the selected base

**3. Update `DealSidebar.tsx`**
- Pass `purchasePrice` number to the `RentalFields` component (already available as a prop)

**4. Update `BudgetCalculator.tsx`**
- Add `refiLtvBase: 'arv'` to `defaultRentalFields`
- Update the `useEffect` that syncs loan amount on ARV/LTV changes to also react to `refiLtvBase` and use the correct base value (ARV or purchase price)

**5. Update analysis components**
- `RentalAnalysis.tsx` and `BRRRAnalysis.tsx` already read `refiLoanAmount` directly, so no changes needed there -- the loan amount is pre-computed from whichever base is selected

