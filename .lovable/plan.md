

## Plan: Compact Edit Task Footer to Single Row

The footer buttons currently span two rows. By removing the text labels from "Delete" and "Add to Calendar" (keeping only their icons), all four buttons fit on one row.

### Changes

**`src/components/project/ProjectTasks.tsx`**
- In `editFooterContent`, collapse the two-row layout back to a single `flex` row
- Change "Delete" button to icon-only (trash icon, no text)
- Change "Add to Calendar" button to icon-only (calendar icon, no text)
- Keep "Cancel" and "Save" as text buttons on the right
- Use `justify-between` with delete+calendar on the left, cancel+save on the right

