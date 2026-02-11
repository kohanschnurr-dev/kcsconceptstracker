

## Add "Assign to Project" Button on Procurement Table

### What it does
Adds a "+" button to each row in the Procurement items table (next to the edit pencil icon). Clicking it opens a popover with a list of active projects. Selecting a project inserts a record into the `project_procurement_items` junction table, which makes the item appear under that project's Procurement tab.

### Changes

**File: `src/pages/Procurement.tsx`**

1. Import `Popover`, `PopoverContent`, `PopoverTrigger` from the UI library
2. In the actions column of each table row (lines 519-537), add a "+" button between the edit (pencil) and delete (trash) buttons
3. The "+" button opens a Popover listing all active projects (excluding completed ones, per existing project selection rules)
4. Each project in the popover is a clickable row; clicking it:
   - Inserts a row into `project_procurement_items` with `project_id`, `item_id`, and default `quantity: 1`
   - Shows a success toast like "Added to Wales"
   - Closes the popover
5. If the item is already assigned to a project, that project shows a checkmark and is non-clickable (prevents duplicates)
6. Track which items are already assigned to which projects by fetching `project_procurement_items` in the existing `fetchData` function

### Technical Details

- The `project_procurement_items` table and RLS policies already exist, so no migration is needed
- Fetch all `project_procurement_items` records in `fetchData()` alongside items/bundles/projects
- Build a lookup map: `itemProjectMap: Record<string, string[]>` mapping item IDs to arrays of assigned project IDs
- Filter projects list to exclude `status = 'complete'` (already fetched, just need to add status to the project query and filter)
- The popover will be compact: project name only, scrollable if many projects, with a check icon for already-assigned ones

