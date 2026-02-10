

## Remove the MAO Rule Check Banner from Profit Breakdown

### What changes
**File: `src/pages/BudgetCalculator.tsx`**

Remove the "Meets 78% Rule" / "Over 78% Rule" banner block at the bottom of the Profit Analysis card (the green/red bar with the checkmark icon). This is the conditional block that renders when `purchasePriceNum > 0 && arvNum > 0`, containing the `CheckCircle2` / `AlertTriangle` icons and the rule text. The MAO gauge in the sticky header already provides this feedback, so this banner is redundant and wastes vertical space.

No other changes needed -- the summary cards (Total Investment, Projected Profit, ROI) will naturally fill the remaining space.

