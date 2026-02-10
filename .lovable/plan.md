

## Fix: Suppress Preset Auto-Calculation When a Baseline is Active

### Problem
Two independent systems are both firing when sqft changes:
1. **BudgetCanvas preset auto-calc** (line 102-116): multiplies each preset category by its own $/sqft rate (Painting $3.50, Tile $12, etc.) -- totaling ~$40k spread across 5 categories
2. **Baseline Filler effect** (in BudgetCalculator): puts the full baseline total (e.g., $97,500) into the Filler category

Both run on sqft change, so the user sees $137,625 total ($40k in presets + $97.5k in Filler) instead of just $97,500 in Filler.

### Solution
Pass a flag from BudgetCalculator to BudgetCanvas indicating whether a baseline is currently active. When active, BudgetCanvas skips the preset auto-calculation entirely -- Filler handles the full budget.

### Technical Changes

**File: `src/components/budget/BudgetCanvas.tsx`**
- Add `baselineActive?: boolean` prop to `BudgetCanvasProps`
- Guard the sqft auto-calc `useEffect` (lines 102-116): skip the preset loop when `baselineActive` is true

**File: `src/pages/BudgetCalculator.tsx`**
- Pass `baselineActive={activeBaselineRate !== null}` to the `BudgetCanvas` component

### Result
- Baseline selected + sqft entered: only Filler gets the total (e.g., $97,500)
- No baseline active + sqft entered: presets auto-calc as before (existing behavior preserved)
