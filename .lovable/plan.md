

## Add "Filler" Category to the "Other" Group for Baseline Budget Placement

### What changes

**1. Add `rehab_filler` to the BudgetCategory type and BUDGET_CATEGORIES list**
- File: `src/types/index.ts`
- Add `'rehab_filler'` to the `BudgetCategory` union type
- Add `{ value: 'rehab_filler', label: 'Filler' }` to `BUDGET_CATEGORIES` array (alphabetically placed)

**2. Add `rehab_filler` to the "Other" group in BudgetCanvas**
- File: `src/components/budget/BudgetCanvas.tsx`
- Add `'rehab_filler'` to the Other group's categories array (line 70)

**3. Update TemplatePicker to put the entire baseline total into the Filler category**
- File: `src/components/budget/TemplatePicker.tsx`
- In `handleBaselineSelect`, instead of splitting the total budget evenly across preset categories, place the full `totalBudget` into `rehab_filler` only
- This makes it immediately clear where the rehab budget from a baseline lives -- one single line item under Other called "Filler" -- and the user can then redistribute it manually across real categories

### How it works for the user
1. User enters sqft and selects a baseline (e.g., Overhaul at $65/sqft = $78,000)
2. The entire $78,000 lands in the "Filler" row under Other
3. Rehab Budget field shows $78,000
4. User manually allocates from Filler into real categories (Painting, Roofing, etc.) as they refine
5. No more confusion about why random categories have inflated numbers

### What stays the same
- Preset categories and their $/sqft rates still exist for manual sqft-based calculations
- Saved database templates still load their own stored category values
- Deal parameters (Purchase Price, ARV, Sqft) remain untouched

