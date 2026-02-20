

## Fix Middle-Click Scroll in Dropdowns

### Problem

The previous fix added an `onMouseDown` handler to `CommandList`, but it does not work because Radix UI uses **pointer events** (`pointerdown`), which fire **before** mouse events. The Radix `DismissableLayer` (used by Popover and Dialog) intercepts `pointerdown` and calls `preventDefault()`, blocking the browser's native middle-click auto-scroll before our `mousedown` handler ever runs.

### Solution

Handle **both** `onPointerDown` and `onMouseDown` for middle-click (button === 1) on scrollable list containers, stopping propagation so Radix layers do not intercept the event and the browser can activate its native auto-scroll.

### Changes

**1. `src/components/ui/command.tsx` - CommandList**

Update the existing handler to also include `onPointerDown`:

```tsx
<CommandPrimitive.List
  ref={ref}
  className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden overscroll-contain", className)}
  onPointerDown={(e) => {
    if (e.button === 1) { e.stopPropagation(); }
  }}
  onMouseDown={(e) => {
    if (e.button === 1) { e.stopPropagation(); }
  }}
  {...props}
/>
```

**2. `src/components/ui/select.tsx` - SelectContent Viewport**

Add the same handlers to the `SelectPrimitive.Viewport` element (the scrollable container inside Select dropdowns):

```tsx
<SelectPrimitive.Viewport
  className={cn(
    "p-1 max-h-[280px] overflow-y-auto overscroll-contain",
    ...
  )}
  onPointerDown={(e) => {
    if (e.button === 1) { e.stopPropagation(); }
  }}
  onMouseDown={(e) => {
    if (e.button === 1) { e.stopPropagation(); }
  }}
>
```

### Why This Works

- `pointerdown` fires first in the event chain; stopping propagation here prevents Radix's `DismissableLayer` from calling `preventDefault()` on the event
- `mousedown` is kept as a fallback for any browser that processes mouse events independently
- `overscroll-contain` keeps the scroll contained within the dropdown so the page behind does not scroll
- Only middle-click (button === 1) is intercepted; normal clicks and right-clicks remain unaffected

