

## Prevent Keyboard Auto-Opening on Edit Task Dialogs

### Problem
When opening an Edit Task dialog on mobile, the first input (Title) gets auto-focused by Radix Dialog, which triggers the on-screen keyboard immediately. Users who just want to view the task are forced to dismiss the keyboard first.

### Solution
Add `onOpenAutoFocus={(e) => e.preventDefault()}` to the `DialogContent` (and `DrawerContent` where applicable) in all three Edit Task dialogs. This prevents Radix from auto-focusing the first input when the dialog opens, so the keyboard stays hidden until the user taps a field.

### Files to Change

1. **`src/pages/DailyLogs.tsx`** (line ~1100)
   - Add `onOpenAutoFocus={(e) => e.preventDefault()}` to the `<DialogContent>` for the Edit Task modal

2. **`src/components/command-center/CommandCenter.tsx`** (line ~323)
   - Add `onOpenAutoFocus={(e) => e.preventDefault()}` to the `<DialogContent>` for the Edit Task modal

3. **`src/components/project/ProjectTasks.tsx`** (lines ~483 and ~497)
   - Add `onOpenAutoFocus={(e) => e.preventDefault()}` to the `<DrawerContent>` (mobile) and `<DialogContent>` (desktop) for the Edit Task modal

### Technical Detail
Radix UI Dialog automatically focuses the first focusable element when opened. The `onOpenAutoFocus` event lets us prevent this default behavior. This only affects the edit dialogs -- the "Add Task" dialog should keep auto-focus since the user always intends to type there.

