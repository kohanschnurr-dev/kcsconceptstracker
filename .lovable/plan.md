

## Fix: Mouse Scroll Not Working in Category Dropdown

### Problem
The `cmdk` library (v1.x) applies `overflow: hidden` as an inline style on its `CommandList` element, which overrides the Tailwind `overflow-y-auto` class. This prevents mouse wheel scrolling in the category dropdown inside the "New Project Event" modal.

### Solution
Override the inline style on the `CommandList` in `NewEventModal.tsx` by adding an explicit `style` prop with `overflowY: 'auto'`. Inline styles take equal specificity, but our explicit `style` prop applied via React will take precedence over cmdk's internal styling.

### Technical Change

**File: `src/components/calendar/NewEventModal.tsx` (line 241)**

Add a `style` override to the `CommandList`:

```tsx
// Before
<CommandList className="max-h-[300px]">

// After
<CommandList className="max-h-[300px]" style={{ overflowY: 'auto' }}>
```

One prop added. Mouse wheel scroll will work in the category list.
