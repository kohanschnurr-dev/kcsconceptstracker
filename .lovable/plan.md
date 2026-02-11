

## Allow Custom Trade Group Headers for Expense Categories

### What's Changing

Right now the trade groups (Structure, MEPs, Finishes, Kitchen & Bath, Exterior, Other) are hardcoded. You'll be able to create your own groups like "Closing", "Pre-Close", or anything else, so you can assign categories to them.

A new "Manage Groups" button will appear in the Expense Categories section of Settings. It opens a small inline area where you can:
- **Add** a new group name (e.g., "Closing", "Pre-Close")
- **Remove** a custom group (categories in it move back to "Other")

Custom groups will appear alongside the built-in ones in every dropdown and in the Budget Calculator canvas.

### Technical Details

**File: `src/lib/budgetCalculatorCategories.ts`**
- Add a `CUSTOM_GROUPS_STORAGE_KEY` constant (`'custom-trade-groups'`).
- Add `loadCustomGroups(): Record<string, BudgetCalcGroupDef>` that reads custom groups from localStorage.
- Add `saveCustomGroups(groups)` to persist.
- Add `getAllGroupDefs(): Record<string, BudgetCalcGroupDef>` that merges the hardcoded `BUDGET_CALC_GROUP_DEFS` with any custom groups (custom groups use the `Package` icon by default).
- Update `buildBudgetCalcGroups` to use `getAllGroupDefs()` instead of the hardcoded object.

**File: `src/components/settings/ManageSourcesCard.tsx`**
- Replace all references to `BUDGET_CALC_GROUP_DEFS` with the new `getAllGroupDefs()` function so custom groups appear in:
  - The trade group dropdown when adding a new category
  - The "Change Category" inline selector
  - The group headers when rendering categories
- Add a small "Manage Groups" section below the Expense Categories list:
  - Input + Add button to create a new group
  - List of custom groups with a delete button (built-in groups cannot be deleted)
  - Deleting a custom group reassigns its categories back to "Other"

**File: `src/components/budget/BudgetCanvas.tsx`**
- Update the import to use `getAllGroupDefs` so the Budget Calculator canvas renders custom groups as collapsible sections alongside the built-in ones.

**File: `src/components/settings/BudgetPresetsSection.tsx`**
- No changes needed (it uses categories, not groups).

### Storage

Custom groups are stored in localStorage under key `'custom-trade-groups'` as an array of `{ key: string; label: string }`. The key is derived from the label (lowercased, underscored). They all use the generic `Package` icon.

### UI in Settings (Expense Categories section)

```text
-- Existing category badges grouped by headers --

[Manage Groups]
  Custom groups:
  [Closing] [x]    [Pre-Close] [x]

  [New group name input] [+ Add]
```

