

## Fix Project Tasks Edit Dialog: Add Subtask Checklist UI

### Problem
The Edit Task dialog in the project-specific view (`ProjectTasks.tsx`) still shows the raw `---LINE_ITEMS---` delimiter and JSON data inside the Notes textarea. This was already fixed in DailyLogs and CommandCenter but was missed here.

### Solution
Apply the same subtask parsing and checklist UI pattern already used in `DailyLogs.tsx` and `CommandCenter.tsx`.

### Technical Changes in `src/components/project/ProjectTasks.tsx`

**1. Import the shared utility and UI components**
- Import `parseDescription`, `serializeDescription`, and `Subtask` from `@/lib/taskSubtasks`

**2. Add subtask state**
- Add `editSubtasks` state of type `Subtask[]` alongside existing edit states

**3. Update `openEditDialog`**
- Parse `task.description` using `parseDescription()` to split the plain text description from subtasks
- Set `editDescription` to just the description text
- Set `editSubtasks` to the parsed subtask array

**4. Update `handleSaveEdit`**
- Use `serializeDescription(editDescription, editSubtasks)` to recombine before saving to the database

**5. Update `editFormContent` UI**
- After the `PasteableTextarea` (Notes and Photos section), add a "Subtasks" section with:
  - Each subtask rendered as a row: `Checkbox` + `Input` + delete `X` button
  - Checked subtasks get strikethrough styling
  - "Add Subtask" button at the bottom
- Remove raw subtask data from the textarea display

### Files Changed
- `src/components/project/ProjectTasks.tsx`
