

## Fix: Filler Should Account for Preset Categories

### Problem
When a baseline template like "High Level" ($55/sqft at 1200 sqft = $66,000) is applied:
- The full $66,000 goes into Filler
- Preset categories (Painting $3.50/sqft, Flooring $8/sqft, etc.) also auto-calculate via BudgetCanvas
- But Filler stays at $66,000 instead of being reduced by the preset totals
- This means the actual total budget ends up higher than intended

### Expected Behavior
- Presets calculate first (e.g., Painting = $4,200, Flooring = $9,600, Tile = $14,400, Drywall = $3,000, Roofing = $6,000 = $37,200 total)
- Filler gets the remainder ($66,000 - $37,200 = $28,800)
- Total budget stays at exactly $66,000 as the user expects

### Changes

**File: `src/pages/BudgetCalculator.tsx`**
- Update the Filler recalculation `useEffect` (lines 217-227) to:
  1. Read the user's current presets from localStorage (key: `budget-category-presets`)
  2. Calculate the sum of all preset category amounts (sqft x each preset rate, or flat amount)
  3. Set Filler = `(sqft x baselineRate) - presetsTotal`
  4. Ensure Filler never goes negative (clamp to 0)

**File: `src/components/budget/TemplatePicker.tsx`**
- Update `handleBaselineSelect` (lines 135-158) to also pre-populate preset category values in the template's `category_budgets` object, so they're set immediately when the template loads (not just when sqft changes later)
- Calculate Filler as the remainder after presets

### Technical Detail

In `TemplatePicker.handleBaselineSelect`:
```
const presets = JSON.parse(localStorage.getItem('budget-category-presets') || '[]');
let presetsTotal = 0;
presets.forEach(p => {
  const amt = p.mode === 'flat' ? p.pricePerSqft : sqftNum * p.pricePerSqft;
  categoryBudgets[p.category] = amt;
  presetsTotal += amt;
});
categoryBudgets['rehab_filler'] = Math.max(0, totalBudget - presetsTotal);
```

In `BudgetCalculator` filler recalculation useEffect:
```
// Read presets, calculate their total, subtract from baseline total
const stored = localStorage.getItem('budget-category-presets');
const presets = stored ? JSON.parse(stored) : [];
let presetsTotal = presets.reduce((sum, p) => {
  return sum + (p.mode === 'flat' ? p.pricePerSqft : sqftNum * p.pricePerSqft);
}, 0);
const fillerValue = Math.max(0, (sqftNum * activeBaselineRate) - presetsTotal);
```

This ensures presets are always accounted for and Filler absorbs only the remainder.
