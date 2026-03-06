

## Move "Back to Home" Button to Page Bottom-Left

The button is currently positioned `absolute bottom-6 left-6` inside the right panel. The user wants it at the absolute bottom-left of the entire page.

### Change

**`src/pages/Auth.tsx`**
- Move the "Back to Home" button out of the right panel div and place it as a fixed/absolute element on the outer `min-h-screen flex` container, positioned `fixed bottom-6 left-6` so it sits at the very bottom-left corner of the viewport.

