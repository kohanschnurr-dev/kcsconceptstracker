

## Consolidate Header Actions into a Three-Dot Menu

### What's Changing

Replace the individual icon buttons (Edit, Delete, Generate Report) next to the project name with a single three-dot (`MoreVertical`) dropdown menu containing four items:

1. **Edit** (Pencil icon) -- triggers inline editing of name/address
2. **Generate Report** (FileText icon) -- opens the project report dialog
3. **Project Status** (submenu or inline options for Active / Complete / On Hold) -- replaces the current status badge dropdown
4. **Delete** (Trash2 icon, destructive styling) -- triggers the delete confirmation flow

The status badge will remain visible as a read-only indicator but will no longer be clickable. Status changes move into the three-dot menu instead.

### Technical Details

**`src/pages/ProjectDetail.tsx`**

1. Remove the three standalone icon buttons (Pencil at line 788-794, Trash2 at 796-803, FileText at 805-812)
2. Remove the `DropdownMenu` wrapper around the status Badge (lines 814-860), keeping only the static Badge display
3. Add a new `DropdownMenu` with a `MoreVertical` icon trigger positioned after the status badge
4. Menu items:
   - "Edit" with `Pencil` icon -- calls `startEditing()`
   - "Generate Report" with `FileText` icon -- calls `setReportOpen(true)`
   - "Project Status" as a `DropdownMenuSub` with sub-items for Active, Complete, On Hold -- calls `handleStatusChange()`
   - Separator
   - "Delete Project" with `Trash2` icon and destructive text color -- calls `setDeleteStep(1)`
5. Import `MoreVertical` from lucide-react and `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` from the dropdown menu component

### Files Changed

- `src/pages/ProjectDetail.tsx` -- replace individual action buttons with a single three-dot dropdown menu

