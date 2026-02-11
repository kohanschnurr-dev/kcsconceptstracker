

## Add "Change Category" to 3-Dot Menu

Add a third option to the existing 3-dot dropdown on each category badge that lets users reassign which trade group (Structure, MEPs, Finishes, etc.) the item belongs to.

### Changes

**File: `src/components/settings/ManageSourcesCard.tsx`**

1. **Add `onChangeGroup` prop to `CategoryBadge`** -- A new optional callback `onChangeGroup?: (newGroup: string) => void` that fires when a user picks a new trade group.

2. **Add "Change Category" menu item** -- Insert a third `DropdownMenuItem` between Rename and Delete. When clicked, it toggles an inline trade group selector (similar to the rename inline input) showing a `Select` dropdown with the trade group options. User picks a new group and confirms.

3. **Inline group selector UI** -- When "Change Category" is clicked, the badge enters a "changing group" mode showing a compact `Select` with trade group options and confirm/cancel buttons (reusing the same inline pattern as rename).

4. **Wire up in `CategorySection`** -- Pass `onChangeGroup` through from `CategorySection` to `CategoryBadge`. The callback will:
   - For Expense Categories (`tradeGrouped`): call `budget.renameItem(value, item.label, newGroup)` to update the group in localStorage while keeping the same label/value.
   - For Calendar Categories (`grouped`): call `calendar.renameItem(value, item.label, newGroup)`.
   - For non-grouped sections: the menu item simply won't appear.

5. **Add `onChangeGroup` prop to `CategorySection`** -- Optional callback `onChangeGroup?: (value: string, newGroup: string) => void`. Only rendered when `grouped` or `tradeGrouped` is true.

### Menu Layout (after change)

```text
[Category Name] [...]
                 |-- Rename
                 |-- Change Category
                 |-- Delete
```

### Inline Group Change UI

```text
[Trade Group Dropdown ▼] [✓] [✗]
```

This reuses the existing `renameItem` hook method (which already supports updating the group) and requires no DB changes since the trade group is stored in localStorage only.

