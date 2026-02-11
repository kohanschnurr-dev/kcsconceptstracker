

## Fix: New Budget Calculator Categories Not Appearing

### Root Cause
In `BudgetCanvas.tsx` (line 363-364), the rendered categories are filtered against `getBudgetCategories()` from `@/types` -- which is the **project budget** category list (stored under `custom-budget-categories`). This is a different list from the **budget calculator** categories (stored under `custom-budget-calc-categories`).

So when you add "Inspections" and "Permits" in Settings under Budget Calculator Categories, `getBudgetCalcCategories()` returns them correctly, but then the filter on line 363 throws them out because they don't exist in the separate project budget list.

### Fix

**File: `src/components/budget/BudgetCanvas.tsx`**

Remove the filtering on lines 363-365. The `dynamicGroups` are already built from `getBudgetCalcCategories()`, so every category in them is valid by definition. The extra filter against `getBudgetCategories()` is unnecessary and actively blocks custom categories.

Change:
```typescript
const groupCategories = group.categories.filter(cat => 
  getBudgetCategories().some(bc => bc.value === cat)
);
```

To:
```typescript
const groupCategories = group.categories;
```

Also remove the unused `getBudgetCategories` import from `@/types` on line 3 (if nothing else in the file uses it -- the preset dialog's `availableCategories` also uses it on line 227, so we need to check that too and switch it to use `getBudgetCalcCategories` instead).

**Additional cleanup (line 227):** The "Edit Presets" dialog's available categories dropdown also uses `getBudgetCategories()`. This should use `getBudgetCalcCategories()` so presets align with the budget calculator's actual category list. Map the result to match the expected format.
