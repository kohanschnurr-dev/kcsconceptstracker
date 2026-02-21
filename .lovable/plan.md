
## Fix Mouse Wheel Scrolling in Project Selector Dropdown

### Problem

The project dropdown list inside `ProjectAutocomplete` does not respond to mouse wheel or middle-click scroll. This is caused by Radix UI's `DismissableLayer` intercepting pointer events, which prevents the browser's native scroll behavior from reaching the scrollable `CommandList`.

### Fix in `src/components/ProjectAutocomplete.tsx`

Add `onWheel`, `onPointerDown`, and `onMouseDown` event handlers to the `CommandList` element to prevent Radix from swallowing scroll-related events:

```tsx
<CommandList
  className="max-h-[300px]"
  onWheel={(e) => e.stopPropagation()}
  onPointerDown={(e) => { if (e.button === 1) e.stopPropagation(); }}
  onMouseDown={(e) => { if (e.button === 1) e.stopPropagation(); }}
  style={{ overscrollBehavior: 'contain' }}
>
```

- `onWheel` stop-propagation ensures wheel events stay within the list and are not captured by the Radix overlay.
- `onPointerDown` / `onMouseDown` for `button === 1` (middle-click) prevents Radix's `DismissableLayer` from calling `preventDefault()`, allowing native auto-scroll.
- `overscroll-contain` keeps scroll confined to the list container.

### Files Changed
- `src/components/ProjectAutocomplete.tsx` -- add event handlers to `CommandList` for scroll fix
