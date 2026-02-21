

## Add Paste & Drag-and-Drop Photo Support to Edit Task Dialog

### Problem

The Edit Task dialog's photo uploader only supports clicking to select files. It lacks Ctrl+V paste and drag-and-drop support that exists elsewhere in the app (e.g., Daily Logs notes). The screenshot also shows the footer alignment could be tightened.

### Solution

Replace the standalone `TaskPhotoUploader` component with the existing `PasteableTextarea` pattern applied to the Notes field, and add a dedicated drag-and-drop zone for the photo area. This gives users three ways to add photos: click, paste (Ctrl+V), and drag-and-drop.

### Technical Details

**`src/components/project/ProjectTasks.tsx`**

1. **Replace the plain `Textarea` for Notes** (lines 302-307) with `PasteableTextarea`, passing `editPhotoUrls` and `setEditPhotoUrls` as the image props. This means pasting/dropping an image into the notes area automatically uploads and attaches it -- matching the pattern used in Daily Logs and Business Expenses.

2. **Enhance `TaskPhotoUploader`** (lines 30-86) to support drag-and-drop directly on the photo grid area:
   - Add `onDragOver`, `onDragLeave`, `onDrop` handlers (same pattern as `PasteableTextarea`)
   - Add `isDragging` state with a visual ring indicator
   - Add a hint line: "Tip: Paste images with Ctrl+V or drag and drop"
   - Support `onPaste` on the outer wrapper so Ctrl+V works when the photo area is focused

3. **Footer alignment fix**: Ensure the Delete button and Save/Cancel buttons are properly spaced with `justify-between` and consistent sizing across mobile drawer and desktop dialog.

### Changes

- `src/components/project/ProjectTasks.tsx`:
  - Import `PasteableTextarea` from `@/components/PasteableTextarea`
  - Replace the plain `Textarea` in the notes section with `PasteableTextarea` configured with `bucketName="project-photos"`, `folderPath="task-photos"`, passing `editPhotoUrls` / `setEditPhotoUrls`
  - Remove the separate `TaskPhotoUploader` render below notes (line 309) since photos are now managed by the `PasteableTextarea`
  - Keep the `TaskPhotoUploader` component definition but it will no longer be rendered in the edit form (it may still be used by AddTaskDialog elsewhere)
  - Add a small "Ctrl+V or drag and drop" hint text near the notes area

### Result

Users can add task photos by:
- Clicking the camera button (existing)
- Pasting from clipboard (Ctrl+V) into the notes field
- Dragging and dropping images onto the notes field

The edit dialog layout stays clean with photos rendered inline below the notes textarea, matching the established pattern across the app.

