

## Fix Baseline Templates to Auto-Populate Preset Category Budgets

### Problem
When selecting a baseline template (e.g., "Overhaul" at $65/sqft with 1200 sqft), the rehab budget shows $0 because `handleBaselineSelect` in `TemplatePicker.tsx` creates a template with empty `category_budgets: {}`. The total budget is calculated (1200 x 65 = $78,000) but never distributed to any categories.

### Solution
Update `handleBaselineSelect` in `src/components/budget/TemplatePicker.tsx` to read the user's category presets from localStorage and distribute the budget across those preset categories using their $/sqft rates.

### Technical Changes

**File: `src/components/budget/TemplatePicker.tsx`**

In `handleBaselineSelect`, before creating the template object:

1. Read category presets from localStorage (same key `budget-category-presets` used by BudgetCanvas)
2. Fall back to the default presets if none are stored (painting $3.50, flooring $8.00, tile $12.00, drywall $2.50, roofing $5.00)
3. Build `category_budgets` by multiplying each preset's $/sqft rate by the entered square footage
4. Pass those populated budgets into the template object

```text
Before:
  category_budgets: {},

After:
  category_budgets: { painting: 4200, flooring: 9600, tile: 14400, drywall: 3000, roofing: 6000 }
  (example for 1200 sqft using default presets)
```

This way, when `handleSelectTemplate` in `BudgetCalculator.tsx` loads the template, the category fields will populate with actual values and the Rehab Budget gauge will reflect the total.

### What stays the same
- Deal parameters (Purchase Price, ARV, Square Footage) are still preserved when applying a template (per the previous change)
- The "Clear All" button still resets everything
- Saved templates from the database still load their own stored category budgets
- The BudgetCanvas preset system and Edit Presets dialog are unchanged
