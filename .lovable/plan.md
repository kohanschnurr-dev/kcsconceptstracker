

## Separate the Trash and Close (X) Buttons in Calendar Event Panel

### Problem
The delete (trash) icon and the Sheet's built-in close (X) button are too close together in the top-right corner of the calendar event side panel, making it easy to accidentally click the wrong one.

### Solution
Add horizontal spacing between the trash button and the X close button by wrapping them in a flex container with a gap, and moving the trash icon slightly left with margin.

### Technical Details

**File: `src/components/calendar/TaskDetailPanel.tsx`**
- In the header area (around line 310-319), add `mr-2` (margin-right) to the AlertDialog trigger Button that wraps the Trash2 icon, creating visual separation from the Sheet's built-in X close button
- This keeps both buttons accessible while preventing misclicks

