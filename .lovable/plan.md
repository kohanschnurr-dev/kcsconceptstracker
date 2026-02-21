

## Add "Take Photo / Upload File" UI to Add Task Dialog

### What's Changing

Replace the current `PasteableTextarea` photo approach in the Add Task dialog with the same dashed-border "Take Photo / Upload File" button pattern used in the Add Expense modal. This gives tasks a consistent, prominent photo upload area matching the rest of the app.

### UI Pattern (matching Add Expense)

A dashed-border box with a label ("Photos") containing:
- Two side-by-side buttons: "Take Photo" (camera icon) and "Upload File" (upload icon)
- When photos are uploaded, thumbnail previews appear inside the box with remove (X) buttons
- Ctrl+V paste and drag-and-drop still work on the entire box area
- The Description field reverts to a standard Textarea (no longer merged with photos)

### Technical Details

**File: `src/components/dashboard/AddTaskDialog.tsx`**

1. Remove `PasteableTextarea` import; re-add standard `Textarea` import
2. Add `Camera`, `Upload` icon imports from lucide-react
3. Add a hidden `<input type="file" accept="image/*" />` ref
4. Add a `handleReceiptPhotoClick` that opens file input with `capture="environment"`
5. Add `handleFileSelect` to upload selected files to `task-photos` bucket via Supabase storage (same logic already in `QuickTaskInput`)
6. Split "Description and Photos" into two sections:
   - **Description**: Standard `Textarea` for text/notes
   - **Photos**: New dashed-border box (`border-2 border-dashed border-primary/30 bg-primary/5 rounded-lg p-3`) containing:
     - Label row with camera icon and "Photos" text
     - `grid grid-cols-2 gap-2` with "Take Photo" and "Upload File" outline buttons
     - Thumbnail strip below when `photoUrls.length > 0` (reuse existing thumbnail pattern with X overlay)
     - Drag-and-drop + paste listeners on the container div
7. Keep all existing save logic, line items, and photo_urls handling unchanged

### Files Changed

- `src/components/dashboard/AddTaskDialog.tsx` -- replace PasteableTextarea with dashed-border photo upload UI matching Add Expense pattern

