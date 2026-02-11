

## Bulk Select and Assign Items to Projects

### What this does
Adds a checkbox column to the Procurement table so you can select multiple items at once and assign them all to a project in one action, instead of clicking the "+" button on each item individually.

### How it works
- A checkbox appears in the header row (above where the "+" buttons are) and next to each item row
- The header checkbox selects/deselects all visible items
- When items are selected, a floating action bar appears showing "X items selected" with a project assignment dropdown
- Picking a project assigns all selected items at once, then clears the selection

### Technical Details

**File: `src/pages/Procurement.tsx`**

1. Add state for selected item IDs: `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())`

2. Add a `Checkbox` in the table header (the last column, above the action buttons) for select-all/deselect-all of currently visible items

3. Add a `Checkbox` in each row (same column, before the edit/+/delete buttons) to toggle individual selection

4. Add a bulk assign handler that loops through selected IDs and inserts them into `project_procurement_items`, skipping already-assigned ones

5. Add a floating bar (fixed at bottom or inline above the table) that appears when `selectedIds.size > 0`, showing:
   - "{count} items selected" 
   - A project dropdown to bulk-assign
   - A "Clear" button to deselect all

6. Clear selection after successful bulk assign

**No database changes needed** -- the existing `project_procurement_items` table and `handleAssignToProject` logic already support this; we just need to call it for multiple items.

