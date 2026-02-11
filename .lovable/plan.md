

## Add "Budget Categories" to Manage Sources

### Problem
The budget calculator categories (Demolition, Framing, Tile, etc. grouped into Structure, MEPs, Finishes, Kitchen & Bath, Exterior, Other) are hardcoded in BudgetCanvas. You want to add/remove these categories and control which group they belong to from the Settings page.

### What Changes

1. **Replace BudgetPresetsSection** in the "Budget Categories" accordion with a new grouped category editor that manages the budget calculator's category list
2. **Extract CATEGORY_GROUPS** from BudgetCanvas into a shared location so both BudgetCanvas and Settings can use/customize them
3. **Add a new `useCustomCategories` type** for budget calculator categories with group support

### Technical Details

**New file: `src/lib/budgetCalculatorCategories.ts`**
- Export the default `BUDGET_CALC_CATEGORY_GROUPS` (Structure, MEPs, Finishes, Kitchen & Bath, Exterior, Other) and their default categories
- Export a flat default list as `CategoryItem[]` with group assignments
- Export a `getBudgetCalcCategories()` function that reads from localStorage (same pattern as other category types)

**File: `src/hooks/useCustomCategories.ts`**
- Add `'budgetCalc'` to the `CategoryType` union
- Add a storage key entry for it (e.g., `'custom-budget-calc-categories'`)

**File: `src/components/settings/ManageSourcesCard.tsx`**
- Remove the `BudgetPresetsSection` import and replace the "Budget Categories" accordion content with a `CategorySection` using the new `budgetCalc` hook -- with `grouped` mode enabled so categories display under their group headers (Structure, MEPs, etc.)
- Users can add new categories to any group, remove categories, or reset to defaults

**File: `src/components/budget/BudgetCanvas.tsx`**
- Replace the hardcoded `CATEGORY_GROUPS` with a dynamic version that reads from the customized category list (via `getBudgetCalcCategories()` or localStorage)
- Group the loaded categories by their `group` field to build the same grouped layout

**Shared group definitions** (in `budgetCalculatorCategories.ts`):
- Structure, MEPs, Finishes, Kitchen & Bath, Exterior, Other
- Each with a label, icon reference, and color classes (similar to calendar category groups)

### Flow
1. User opens Settings > Manage Sources > Budget Categories
2. Sees all current categories grouped by Structure, MEPs, Finishes, etc.
3. Can add a new category to any group, remove existing ones, or reset to defaults
4. Changes persist via localStorage (same as all other category sources)
5. Budget Calculator reads the updated category list and renders accordingly
