

## Enable Middle-Click Scroll in Project Dropdown

### Problem

The project selection dropdown (using `cmdk` Command component) does not respond to middle-mouse-button scrolling, which is a common way users scroll through lists.

### Solution

The `cmdk` `CommandList` renders a `div` with `overflow-y-auto`, but the component's internal event handling can interfere with native scroll behavior. Adding `onPointerDown` passthrough and `overscroll-behavior-contain` to the `CommandList` ensures the browser's native scroll (including middle-click scroll) works properly.

### Technical Details

**`src/components/ui/command.tsx`** (CommandList, lines 57-66)

- Add `overscroll-behavior-contain` to the CommandList className to keep scroll contained within the list and prevent event interference.
- Add an `onMouseDown` handler that stops propagation for middle-click (button === 1) so the browser can handle the auto-scroll natively without `cmdk` intercepting it.

```tsx
<CommandPrimitive.List
  ref={ref}
  className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden overscroll-contain", className)}
  onMouseDown={(e) => {
    if (e.button === 1) e.stopPropagation();
  }}
  {...props}
/>
```

This is a minimal, non-breaking change to the shared `CommandList` component that enables middle-click scrolling across all command/autocomplete dropdowns in the app.

