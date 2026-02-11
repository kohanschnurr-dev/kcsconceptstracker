

## Add Trade Group Selector and 3-Dot Menu (Rename/Delete) to Expense Categories

### What's Changing

1. **Trade group selector when adding new categories** -- When adding a new Expense Category, a dropdown appears letting you pick which group it belongs to (Structure, MEPs, Finishes, Kitchen and Bath, Exterior, Other). Currently new items always land in "Other" because there's no way to assign them.

2. **Replace X button with 3-dot menu** -- Each category badge currently shows an "X" to delete. This will become a small 3-dot (...) icon that opens a dropdown with two options:
   - **Rename** -- Opens an inline input to type a corrected name. Under the hood this creates the new name, reassigns all expenses/budgets (same logic as the existing reassign dialog), and removes the old one.
   - **Delete** -- Opens the existing reassign/delete dialog (no behavior change).

### Technical Details

**File: `src/hooks/useCustomCategories.ts`**
- Add a `renameItem(oldValue, newLabel, newGroup?)` method that updates the item in-place (new value derived from new label, preserves group).
- Return `renameItem` from the hook.

**File: `src/lib/budgetCalculatorCategories.ts`**
- Update `CATEGORY_GROUP_MAP` lookups in rendering to also check `item.group` as a fallback, so custom categories with a group assignment are rendered in the correct trade section.

**File: `src/components/settings/ManageSourcesCard.tsx`**
- **Trade group selector**: When `tradeGrouped` is true, show a trade group `Select` dropdown (Structure, MEPs, Finishes, etc.) next to the new category input. Pass the selected group to `onAdd`.
- **3-dot menu**: Replace the `<button><X /></button>` on each badge with a `DropdownMenu` (from Radix) containing "Rename" and "Delete" items.
- **Rename flow**: When "Rename" is clicked, show an inline input (replacing the badge text) with save/cancel. On save:
  - For Expense Categories (`tradeGrouped`): call `add_budget_category` RPC to register the new enum value, then run the same reassign logic from `ReassignCategoryDialog` (move expenses, carry over budgets), then update localStorage via the hook.
  - For other sections: update the DB column value directly, then update localStorage.
- **Delete flow**: Same as current -- triggers the existing `onBeforeRemove` callback.
- Add `onRename` callback prop to `CategorySection`.

**File: `src/components/settings/ReassignCategoryDialog.tsx`**
- Export the core reassign logic as a reusable function (or add a `mode: 'rename'` prop) so the rename flow can reuse the DB migration logic without opening a full dialog.

### UI Layout for Add Row (Expense Categories)

```text
[Trade Group Dropdown] [Category Name Input] [+ Button]
```

### UI for Each Badge

```text
[Category Name] [...] 
                 |-- Rename
                 |-- Delete
```
