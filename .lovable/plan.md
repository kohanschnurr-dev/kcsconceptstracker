

## Fix Drag-and-Drop in Import Modal

### Problem
The Radix Dialog component intercepts browser drag-and-drop events, preventing the CSV file drop from reaching the small upload button. The drag visual feedback triggers but the actual drop never processes.

### Solution
Move the drag-and-drop handlers from the small upload button to the entire upload step container, so the drop zone covers the full modal content area. Also add `onDragOver` to the `DialogContent` to prevent the dialog from swallowing the event.

### Changes

**File: `src/components/project/ImportExpensesModal.tsx`**

1. **Wrap the entire upload step in a drop zone div**: Move `onDragOver`, `onDragLeave`, and `onDrop` handlers from the small upload `<button>` to the outer `<div className="space-y-6 py-4">` that wraps the full upload step content. This makes the entire modal body a valid drop target.

2. **Remove drag handlers from the upload button**: The button keeps its click handler but no longer needs drag event handlers since the parent div handles drops.

3. **Add visual feedback on the outer container**: Apply the `isDragging` border/background highlight to the outer wrapper so the user sees the entire area light up when dragging a file over the modal.

4. **Add `onDragOver` to `DialogContent`**: Prevent the dialog overlay from eating the drag event by adding `e.preventDefault()` on dragover at the DialogContent level.

### Files Modified
- `src/components/project/ImportExpensesModal.tsx`

