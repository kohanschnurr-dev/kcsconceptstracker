

## Update Daily Logs Edit Task Dialog to Match Project Tasks Layout

### Problem
The "Edit Task" dialog in Daily Logs has a different field order than the Project Tasks version. The Daily Logs version shows: Title, Description, Subtasks, Priority/Status, Due Date, Photos. The Project Tasks version (the preferred layout) shows: Title, Priority/Status, Due Date, Notes and Photos, Subtasks.

### Changes in `src/pages/DailyLogs.tsx`

Reorder the edit form sections (lines 1103-1212) to match the Project Tasks layout:

1. **Title** (stays first -- no change)
2. **Priority / Status** (move up from after Subtasks to right after Title)
3. **Due Date** (move up from after Priority/Status)
4. **Notes and Photos** (combine Description textarea and Photos into one labeled section with icon, matching the "Notes and Photos" pattern from ProjectTasks)
5. **Subtasks** (move to last content section, before footer)

Also update styling to match:
- Replace plain "Description" label with icon-based "Notes and Photos" label (using FileText icon)
- Replace the separate "Photos (optional)" section with inline photo display below the textarea (matching the PasteableTextarea pattern in ProjectTasks, or simply moving the TaskPhotoUploader under the same label)
- Use consistent spacing (`space-y-1.5` instead of `space-y-2`)
- Use dashed-border style for "Add Subtask" button to match ProjectTasks

### Files Changed
- `src/pages/DailyLogs.tsx`
