

## Rename "Budget Categories" to "Expense Categories" and Add Budget Calculator Presets Section

### What Changes

1. **Rename**: The existing "Budget Categories" accordion item in Manage Sources becomes "Expense Categories" (since those categories are used for expense tracking)
2. **New Section**: Add a "Budget Categories" accordion item that embeds the budget calculator preset editor (the same Edit Presets dialog from BudgetCanvas, but inline)

### Technical Details

**File: `src/components/settings/ManageSourcesCard.tsx`**

1. Rename the accordion trigger text from `Budget Categories ({budget.items.length})` to `Expense Categories ({budget.items.length})`
2. Add a new `AccordionItem` for "Budget Categories" that contains an inline version of the preset editor (category list with $/sqft rates, mode selector, add/remove, reset to defaults)
3. Import `supabase`, `useAuth`, and the preset types/defaults from BudgetCanvas
4. Add state management for presets (load from database on mount, save to both database and localStorage)

**New component or inline section**: `BudgetPresetsSection`
- Reuses the same preset editing logic currently in BudgetCanvas's Edit Presets dialog
- Loads presets from the `profiles.budget_presets` column (same source as BudgetCanvas)
- On save, persists to both database and localStorage (same pattern as BudgetCanvas)
- Shows the category list with mode ($/sqft or Flat $), amount input, and remove button
- Includes "Add Category" dropdown and "Reset to Defaults" button

**File: `src/components/budget/BudgetCanvas.tsx`**
- Extract the preset types (`CategoryPreset`, `DEFAULT_CATEGORY_PRESETS`, `PRESETS_STORAGE_KEY`) into a shared file so both BudgetCanvas and ManageSourcesCard can use them
- No functional changes to BudgetCanvas itself

**New File: `src/lib/budgetPresets.ts`**
- Export `CategoryPreset` interface, `DEFAULT_CATEGORY_PRESETS`, and `PRESETS_STORAGE_KEY`
- Both BudgetCanvas and ManageSourcesCard import from here

### Summary
- Rename "Budget Categories" label to "Expense Categories" (1 line change)
- Extract preset constants to shared file
- Add inline preset editor in a new "Budget Categories" accordion section in Manage Sources
