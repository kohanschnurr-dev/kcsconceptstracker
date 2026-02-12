

## Allow Reordering of Trade Groups

### What Changes
Add drag-and-drop reordering to the trade groups (Structure, MEPs, Finishes, Kitchen & Bath, Exterior, Other, and any custom groups like Purchase & Sale) in the **Manage Groups** section under Settings > Expense Categories. The new order will persist and be reflected everywhere groups appear: the Budget Calculator canvas, the category assignment dropdown, and the Settings display.

### How It Works
- In the "Manage Groups" area, each group badge gets a drag handle (grip icon)
- Drag groups up/down to reorder them
- The order is saved to localStorage (and synced via the existing settings sync mechanism)
- Built-in groups (Structure, MEPs, etc.) and custom groups share the same orderable list

### Technical Details

**1. New storage key for group order** (`src/lib/budgetCalculatorCategories.ts`)
- Add a `GROUPS_ORDER_STORAGE_KEY` constant (`'trade-groups-order'`)
- Add `loadGroupOrder()` and `saveGroupOrder()` helpers that read/write an ordered array of group keys
- Update `getAllGroupDefs()` to return groups sorted by the saved order (falling back to the current default order for any untracked keys)

**2. Make ManageGroupsSection drag-sortable** (`src/components/settings/ManageSourcesCard.tsx`)
- Import `@dnd-kit/core` and `@dnd-kit/sortable` (already installed)
- Render all groups (built-in + custom) as sortable items using `useSortable`
- On drag end, compute the new order and call `saveGroupOrder()`
- Add a small grip/drag handle icon to each group badge

**3. Files Modified**
- `src/lib/budgetCalculatorCategories.ts` — group order persistence + sorted `getAllGroupDefs()`
- `src/components/settings/ManageSourcesCard.tsx` — drag-and-drop UI in ManageGroupsSection

