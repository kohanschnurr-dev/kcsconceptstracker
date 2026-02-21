

## Fix: Due Date Input Alignment in Edit Task Dialogs

### Problem
The due date input box in the Edit Task dialogs is not properly aligned on mobile -- it doesn't fill the full width of the container, making the layout look inconsistent compared to other fields.

### Solution
Add `className="w-full"` to the date `Input` in all three Edit Task dialogs so it stretches to match the other fields.

### Files to Change

1. **`src/pages/DailyLogs.tsx`** (line ~1151)
   - Add `className="w-full"` to the due date Input

2. **`src/components/command-center/CommandCenter.tsx`** (line ~434)
   - Add `className="w-full"` to the due date Input

3. **`src/components/project/ProjectTasks.tsx`** (line ~302)
   - Add `className="w-full"` to the due date Input

All three are the same one-prop addition to ensure consistent full-width rendering on mobile.

