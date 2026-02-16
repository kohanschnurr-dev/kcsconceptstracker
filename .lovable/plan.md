
## Combine Cash Flow + BRRR into a Single Toggled Section

### What Changes
Replace the two stacked analysis cards (Cash Flow Analysis + BRRR Analysis) with a single section that has a **segmented toggle** at the top labeled "Loan" with two options: **Regular** (left) and **Refi** (right).

- **Regular** selected: Shows the Cash Flow Analysis (RentalAnalysis component)
- **Refi** selected: Shows the BRRR Analysis (BRRRAnalysis component)

### How It Works
- A `Tabs` component (already used elsewhere in the app) provides the segmented control
- Default selection is "Regular" (Cash Flow)
- Switching to "Refi" swaps in the BRRR Analysis in the same spot
- Only one analysis is visible at a time, reducing scroll and clutter

### Technical Details

**File: `src/pages/BudgetCalculator.tsx`**
1. Add a local state `loanView` (`'regular' | 'refi'`) defaulting to `'regular'`
2. Replace the current block (lines 643-664) that renders both `RentalAnalysis` and `BRRRAnalysis` with a `Tabs` wrapper:
   - `TabsList` with two triggers: "Regular" (left) and "Refi" (right)
   - `TabsContent value="regular"` renders `RentalAnalysis`
   - `TabsContent value="refi"` renders `BRRRAnalysis`
3. The section header/label above the tabs will read "Loan"

No changes needed to `RentalAnalysis.tsx` or `BRRRAnalysis.tsx` -- they render identically, just conditionally shown.
