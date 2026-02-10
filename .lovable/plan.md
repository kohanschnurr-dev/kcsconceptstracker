

## Fix: Even Distribution of Baseline Budget Across Preset Categories

### Problem
When selecting a baseline (e.g., Overhaul at $65/sqft x 1200 sqft = $78,000), the scaling logic distributes the entire $78k proportionally by each preset's $/sqft rate. Since Tile has the highest rate ($12 vs $3.50 for Painting), it gets ~$35k -- which is unrealistic and not useful for quick underwriting.

### Solution
Instead of proportional scaling, distribute the tier's total budget **evenly** across all preset categories. This gives a simple, balanced starting point that users can then adjust per-category.

### Technical Change

**File: `src/components/budget/TemplatePicker.tsx`** -- simplify `handleBaselineSelect`

Replace the current scaling logic (lines 153-162):
```
// Current: proportional scaling that over-weights high-rate categories
const rawRateSum = presets.reduce(...)
const scaleFactor = rawRateSum > 0 ? tier.pricePerSqft / rawRateSum : 1;
categoryBudgets[preset.category] = sqftNum * preset.pricePerSqft * scaleFactor;
```

With even distribution:
```
// New: split total budget evenly across preset categories
const perCategory = presets.length > 0 ? Math.round(totalBudget / presets.length * 100) / 100 : 0;
presets.forEach(preset => {
  if (sqftNum > 0) {
    categoryBudgets[preset.category] = perCategory;
  }
});
```

For Overhaul (1200 sqft, $78,000 total, 5 preset categories):
- Each category gets $15,600 instead of Tile getting $35k and Painting getting $10k
- This serves as a quick placeholder that users refine, not a final estimate

### What stays the same
- Deal parameters (Purchase Price, ARV, Sqft) still preserved
- Total budget still equals sqft x tier rate
- Preset categories still sourced from localStorage / defaults
- Saved database templates still load their own stored values

