

## Add "Edit" Button to Project Detail Header

### What Changes

Replace the current click-on-text-to-edit behavior for the project name and address with a single "Edit" button (pencil icon). Clicking the button puts both fields into edit mode simultaneously. Clicking outside or pressing Enter saves changes.

### How It Works

- A small pencil icon button appears next to the project name/address area
- Clicking it toggles both name and address into editable Input fields at once
- Clicking outside (blur) or pressing Enter saves the change
- Pressing Escape cancels editing
- The name and address text are no longer directly clickable to edit (removes the cursor-pointer styling from them)

### Technical Details

**File: `src/pages/ProjectDetail.tsx`**

1. Replace `editingName` and `editingAddress` states with a single `isEditing` boolean
2. Remove click handlers from the `<h1>` (name) and `<span>` (address) elements; remove their `cursor-pointer` and `hover:text-primary` classes
3. Add a small `Pencil` icon button near the header that sets `isEditing = true`
4. When `isEditing` is true, both name and address render as `<Input>` fields (same save-on-blur/Enter logic as today)
5. When both fields blur out (last field loses focus), `isEditing` resets to false
6. Add `Pencil` to the lucide-react imports
7. Remove now-unused `nameInputRef` and `addressInputRef` if consolidated, or keep them for auto-focus on the name input
