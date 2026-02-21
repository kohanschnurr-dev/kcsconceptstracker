

## Fix: Checkboxes Not Responding to Clicks in "Add Items from Library"

### Problem

In the library item list, each row has a parent `div` with `onClick={() => toggleItem(item.id)}` and a `Checkbox` inside it with `onClick={(e) => e.stopPropagation()}`. The `stopPropagation` prevents the parent handler from firing, but the `Checkbox` has no `onCheckedChange` of its own -- so clicking directly on the checkbox does nothing.

Clicking the row area outside the checkbox works (the parent handler fires), but clicking the checkbox itself is a dead zone.

### Fix in `src/components/project/ProcurementTab.tsx`

Add an `onCheckedChange` handler to the `Checkbox` so it calls `toggleItem` directly:

```tsx
<Checkbox 
  checked={selectedIds.has(item.id)} 
  onCheckedChange={() => toggleItem(item.id)}
  onClick={(e) => e.stopPropagation()}
/>
```

This keeps `stopPropagation` to avoid double-toggling (checkbox click + parent click), while giving the checkbox its own toggle behavior.

### Files Changed
- `src/components/project/ProcurementTab.tsx` -- add `onCheckedChange` to the Checkbox (line 914-917)

