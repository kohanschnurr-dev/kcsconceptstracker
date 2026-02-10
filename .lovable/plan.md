

## Fix: Baseline Templates Must Scale Category Budgets by Tier Rate

### Root Cause
When selecting different baselines (Cosmetic at $35/sqft vs Overhaul at $65/sqft), the category budgets are identical because `handleBaselineSelect` multiplies sqft by each preset's fixed $/sqft rate (painting $3.50, flooring $8.00, etc.) regardless of which tier is chosen. The tier rate ($35, $45, $55, $65) is only stored in `total_budget` but never influences the actual category values.

Sum of default preset rates = $31/sqft. So every baseline produces the same $31/sqft worth of categories, making the rehab budget, MAO gauge, and profit breakdown all stay static.

### Solution
Scale the preset category amounts proportionally so their sum equals the tier's total budget (`sqft x tier.pricePerSqft`).

### Technical Change

**File: `src/components/budget/TemplatePicker.tsx`** -- update `handleBaselineSelect`

Current logic (produces same result for all tiers):
```
categoryBudgets[preset.category] = sqftNum * preset.pricePerSqft;
```

New logic:
1. Calculate the raw sum of all preset rates (e.g., 3.50 + 8.00 + 12.00 + 2.50 + 5.00 = 31.00)
2. Calculate a scale factor = tier.pricePerSqft / rawSum (e.g., for Overhaul: 65 / 31 = 2.097)
3. Multiply each preset amount by the scale factor so categories sum to the tier total

```
const rawRateSum = presets.reduce((s, p) => s + p.pricePerSqft, 0);
const scaleFactor = rawRateSum > 0 ? tier.pricePerSqft / rawRateSum : 1;

presets.forEach(preset => {
  categoryBudgets[preset.category] = Math.round(sqftNum * preset.pricePerSqft * scaleFactor * 100) / 100;
});
```

This means:
- Cosmetic ($35/sqft): painting = sqft x 3.50 x 1.129 = sqft x $3.95
- Overhaul ($65/sqft): painting = sqft x 3.50 x 2.097 = sqft x $7.34
- Categories maintain their relative proportions but scale to match the selected tier
- Rehab Budget, MAO Gauge, and Profit Breakdown all update correctly when switching tiers

### What stays the same
- Deal parameters (Purchase Price, ARV, Sqft) remain untouched when switching templates
- Saved database templates still load their own stored category values
- Clear All still resets everything
- The preset rates themselves are not modified -- only scaled at application time
