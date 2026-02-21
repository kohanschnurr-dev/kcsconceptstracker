

## Fix: Prevent Horizontal Scrolling in Dialogs on Mobile

### Problem
On mobile, the dialog content allows horizontal swiping/scrolling even when there's no content overflowing horizontally. This creates a jarring UX where the dialog shifts sideways.

### Solution
Add `overflow-x-hidden` to the `DialogContent` base component to prevent any horizontal scrolling while keeping vertical scroll intact.

### File: `src/components/ui/dialog.tsx`
- Change `overflow-y-auto` to `overflow-y-auto overflow-x-hidden` in the DialogContent className (line 39)
- This prevents horizontal scroll globally across all dialogs while preserving the vertical scroll fix from earlier

Single-line change in one file.

