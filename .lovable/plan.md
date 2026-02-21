

## Fix: Dialog Still Allows Horizontal Scroll on Mobile

### Problem
The dialog uses `w-full` which makes it exactly 100% of the viewport width on mobile. Even with `overflow-x-hidden` on the dialog content, the dialog container itself sits flush against both screen edges with no breathing room. Any tiny pixel rounding or browser chrome behavior can cause the page body to become horizontally scrollable.

### Solution
Replace `w-full` with `w-[calc(100vw-2rem)]` in the base `DialogContent` component. This ensures a 1rem (16px) margin on each side of the dialog on mobile, preventing edge-to-edge rendering that triggers horizontal scroll. The `max-w-lg` still caps the width on larger screens.

### File to Change

**`src/components/ui/dialog.tsx`** (line 39)
- Change `w-full max-w-lg` to `w-[calc(100vw-2rem)] max-w-lg`

This is a single class change in one file that affects all dialogs globally.

