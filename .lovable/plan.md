

## Upgrade Project-Specific "Add Task" Modal to Full-Featured Version

### Problem
The "Add Task to [Project]" modal in the project view (image 1) is a simplified version with only Title, Priority, and Due Date. It should match the full "Add Task" dialog (image 2) used elsewhere, which includes Description, Photos, Subtasks, Status, and a Cancel/Save footer.

### Changes in `src/components/project/AddTaskModal.tsx`

Rebuild this component to match the `AddTaskDialog` pattern while keeping the `projectId`/`projectName` props (since the project is already known):

**Field order (matching image 2):**
1. Title
2. Description (Textarea, "Add details...")
3. Photos (Take Photo / Upload File / paste / drag-drop, using task-photos bucket)
4. Subtasks (checklist with checkboxes, add/remove, strikethrough when done)
5. Priority / Status (side-by-side grid)
6. Due Date (native date input)
7. Footer: Cancel + Save buttons

**Specific updates:**
- Add `description`, `status`, `photoUrls`, `subtasks`, `isUploading`, `isDragging`, `previewUrl` state
- Add photo upload logic (file select, camera capture, paste, drag-drop) matching `AddTaskDialog`
- Add subtask management (add, remove, toggle, update) with `Subtask` type from `taskSubtasks.ts`
- Use `serializeDescription` to combine description + subtasks before insert
- Include `photo_urls` in the database insert
- Replace the single "Add to Pipeline" button with Cancel/Save footer
- Widen dialog to `sm:max-w-lg`
- Add photo preview dialog
- Title changes from "Add Task to [Project]" to "Add Task to [Project]" (kept, but layout updated)

### Files Changed
- `src/components/project/AddTaskModal.tsx` -- full rewrite to match AddTaskDialog style
