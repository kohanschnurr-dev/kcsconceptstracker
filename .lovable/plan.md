

## Fix: Let Presets and Baseline Coexist

### Problem
The current guard (`!baselineActive`) completely blocks preset auto-calculation when a baseline is active. But these two systems should coexist:
- **Filler** holds the baseline total (sqft x tier rate)
- **Presets** (Painting, Flooring, etc.) should still auto-calculate their own $/sqft rates when sqft changes

The user expects that after selecting a baseline and entering sqft, both Filler AND preset categories populate. The presets give granular estimates; the Filler gives the overall baseline budget. They serve different purposes.

### Solution
Remove the `baselineActive` guard from the preset auto-calc effect entirely. Instead, make the Filler effect in BudgetCalculator handle its own value independently — which it already does via its own `useEffect`.

The two effects already target different categories:
- BudgetCanvas presets target: Painting, Flooring, Tile, Drywall, Roofing (or whatever the user configured)
- BudgetCalculator baseline targets: `rehab_filler` only

There is no overlap, so there is no double-counting. The original "double-counting" issue was a misdiagnosis — the real total was correct because presets and Filler are additive by design. The user just needed to see both.

### Technical Changes

**File: `src/components/budget/BudgetCanvas.tsx`**
- Revert the `baselineActive` guard on line 109: change `!baselineActive` back to the original condition
- Remove `baselineActive` from the destructured props (keep the prop in the interface for now to avoid breaking the parent, or remove it from both)

**File: `src/pages/BudgetCalculator.tsx`**
- No changes needed — the Filler effect already works independently

### Result
- Select baseline + enter sqft: Filler gets full baseline total AND preset categories get their own $/sqft calculations
- Enter sqft without baseline: presets auto-calc as before
- Both are visible to the user, no confusion about missing values

