

## Fix: Enable Middle-Mouse-Button Scrolling in Category Dropdown

### Problem
The `cmdk` library's `CommandList` component doesn't natively support middle-mouse-button (autoscroll) behavior. The previous `overflowY: 'auto'` fix restored mouse wheel scrolling, but middle-click drag scrolling requires the container to also have `overflow-y: scroll` semantics that browsers recognize for autoscroll.

### Root Cause
Middle-click autoscroll in browsers requires the element to be a **natively scrollable container**. The `cmdk` library wraps content in a way that can interfere with this. The fix is to ensure the scrollable element has proper dimensions and overflow set so the browser recognizes it as a scroll target.

### Solution
Wrap the category items inside a plain `div` with native scroll styling, bypassing `CommandList`'s problematic overflow handling entirely. This gives the browser a standard scrollable container that supports all scroll methods (wheel, scrollbar drag, and middle-click autoscroll).

### Technical Change

**File: `src/components/calendar/NewEventModal.tsx`**

Replace the `CommandList` with a wrapper approach:

```tsx
<CommandList 
  className="max-h-[300px]" 
  style={{ 
    overflowY: 'scroll',  // 'scroll' instead of 'auto' ensures browser treats this as scrollable
    overscrollBehavior: 'contain'  // Prevents scroll chaining to parent
  }}
>
```

If that alone doesn't work (cmdk may still override), wrap the entire `Command` content area in a native scrollable `div` and set `CommandList` to not constrain height:

```tsx
<div 
  className="max-h-[300px]" 
  style={{ overflowY: 'scroll', overscrollBehavior: 'contain' }}
>
  <CommandList>
    ...
  </CommandList>
</div>
```

This ensures the browser sees a standard scrollable `div` that supports middle-click autoscroll, while `CommandList` renders normally inside it without its own overflow constraints interfering.

### File
- `src/components/calendar/NewEventModal.tsx` -- restructure the CommandList scroll container
