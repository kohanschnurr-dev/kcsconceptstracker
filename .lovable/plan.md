
## Add Editable Closing and Holding Cost Percentages

### Overview
Add a pencil icon next to the "Closing + Holding" line in the Deal Sidebar that lets you click to edit the percentages (currently hardcoded at 2% buy closing and 3% holding).

### How It Works
- By default, closing is 2% and holding is 3% (current behavior)
- A small pencil icon appears next to the values
- Clicking it reveals inline editable percentage inputs for both
- The edited percentages flow through to all profit/analysis calculations

### Technical Details

**1. `src/pages/BudgetCalculator.tsx`**
- Add two new state variables: `closingPct` (default `'2'`) and `holdingPct` (default `'3'`)
- Update calculations to use these dynamic percentages instead of hardcoded `0.02` / `0.03`
- Pass `closingPct`, `holdingPct`, and their setters down to `DealSidebar`

**2. `src/components/budget/DealSidebar.tsx`**
- Add new props: `closingPct`, `onClosingPctChange`, `holdingPct`, `onHoldingPctChange`
- Add local `isEditingCosts` state
- Replace the static "Closing (Buy, 2%)" and "Holding (3%)" lines with:
  - When not editing: current display + a small `Pencil` icon button that toggles edit mode
  - When editing: inline number inputs for each percentage with a "Done" or blur-to-close behavior
- Update the local `closingCostsBuy` and `holdingCosts` display calculations to use the dynamic percentages

**3. No changes needed** to `RentalAnalysis.tsx` or `BRRRAnalysis.tsx` since they receive pre-computed `closingCostsBuy` and `holdingCosts` as props from `BudgetCalculator.tsx`.
