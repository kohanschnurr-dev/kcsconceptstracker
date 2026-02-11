
## Fix Category Dropdown Scroll in New Event Modal

### Problem
The category dropdown list inside the "New Project Event" modal can only be scrolled by dragging the tiny scrollbar. Mouse wheel scrolling doesn't work because the parent `DialogContent` has `overflow-y-auto` which captures wheel events before they reach the dropdown.

### Fix

**File: `src/components/calendar/NewEventModal.tsx`**

1. **Line 241** - Change the wrapper div's `overflowY: 'scroll'` to `overflowY: 'auto'` and add an `onWheel` handler that calls `e.stopPropagation()` to prevent the modal from stealing wheel events:

```
// Before
<div style={{ overflowY: 'scroll', maxHeight: 300, overscrollBehavior: 'contain' }}>

// After
<div
  style={{ overflowY: 'auto', maxHeight: 300, overscrollBehavior: 'contain' }}
  onWheel={(e) => e.stopPropagation()}
>
```

This single change stops the modal's scroll container from intercepting mouse wheel events meant for the category list, enabling effortless scrolling.
