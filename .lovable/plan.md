

## Replace 3-Dot Menu with Simple "Edit" Button

### What Changes

The current dropdown menu with multiple options will be replaced by a single "Edit" button in the bottom-right corner. Clicking it puts both the name and address into edit mode simultaneously. Clicking anywhere outside (or pressing Enter) saves the changes.

### How It Works

- A small "Edit" button (with pencil icon) sits in the bottom-right corner of each card
- Clicking it toggles an `isEditing` state that makes both name and address fields editable at once
- Clicking outside the inputs (blur) automatically saves any changes
- Pressing Enter also saves; Escape cancels
- The dropdown menu, status change, and delete options are removed from the card

### Technical Details

**File: `src/components/dashboard/ProjectCard.tsx`**

1. Remove all dropdown menu imports and the `DropdownMenu` component block
2. Remove unused icon imports (`MoreVertical`, `CheckCircle`, `PauseCircle`, `Play`, `Trash2`)
3. Replace `editingName` and `editingAddress` with a single `isEditing` boolean state
4. Replace the 3-dot menu button with a simple button showing a `Pencil` icon and/or "Edit" text
5. Clicking the Edit button sets `isEditing = true`, which makes both name and address render as `<Input>` fields
6. On blur of each input, call `saveField` for that field (same logic as today)
7. Remove `updateStatus` and `deleteProject` functions since those menu options are being removed

