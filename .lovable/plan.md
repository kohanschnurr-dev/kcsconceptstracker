

## Fix: Mobile Dialog Cannot Be Dismissed

### Problem
On mobile, the Add Task dialog content overflows the viewport. The close X button scrolls off-screen and the Cancel button is buried below the fold, trapping the user.

### Solution
Add `max-h-[90vh] overflow-y-auto` to the `DialogContent` base component so all dialogs respect the viewport height and scroll internally. This fixes the issue globally for every dialog in the app.

### File: `src/components/ui/dialog.tsx`
- Add `max-h-[90vh] overflow-y-auto` to the `DialogContent` className string (line 39)
- This ensures the dialog never exceeds 90% of the viewport height and scrolls its content internally
- The close X button stays fixed at top-right (absolute positioned within the content)
- The footer with Cancel/Save remains reachable by scrolling

This is a single-line change that fixes the issue across all dialogs app-wide.

