
## Fix Mouse-Wheel Scrolling in Calendar Category Dropdown

### Problem
The category selection dropdown in the New Event modal only scrolls when dragging the scrollbar handle. Mouse-wheel scrolling does not work due to CSS constraints in the `cmdk` library's `CommandList` component.

### Solution
Replace the `CommandList` scroll behavior with a native scrollable `div` wrapper that supports mouse-wheel and trackpad scrolling. This follows the same pattern already established in the project for other Command-based modals.

### Technical Details

**File: `src/components/calendar/NewEventModal.tsx`**
- On line 241, change the `CommandList` to remove the inline `overflowY` style and `max-h` class, setting it to `overflow-visible` instead
- Wrap the `CommandList` in a native `div` with `style={{ overflowY: 'scroll', maxHeight: 300, overscrollBehavior: 'contain' }}`
- This bypasses the cmdk library's internal CSS that blocks wheel scrolling while preserving keyboard navigation and filtering
