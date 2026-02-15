

## Move Amortization Schedule Below Interest Only Toggle

### What Changes
Move the Amortization Schedule from the right column (after Payoff Timeline) to the left column, directly below the Interest Only toggle. This places it closer to the related setting so users immediately see the P&I breakdown context.

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

1. **Remove** the Amortization Schedule block from its current position in the right column (lines 740-749, after Payoff Timeline).

2. **Insert** the same block into the left column, right after the Interest Only toggle's closing `</div>` (after line 610), but before the column's closing `</div>` (line 611):
   ```
   {!interestOnly && loanAmount > 0 && loanTermMonths > 0 && (
     <AmortizationSchedule ... />
   )}
   ```

No logic changes -- purely a layout relocation.
