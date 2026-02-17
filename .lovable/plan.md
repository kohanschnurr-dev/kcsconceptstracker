

## Move Pencil Edit Icon to "Estimated Costs" Header

### What's Changing
The pencil icon currently sits inline next to the "Holding" cost row. It should be moved up to the "Estimated Costs" header line so it's clearly associated with editing all cost fields, not just holding.

### Technical Detail

**File: `src/components/budget/DealSidebar.tsx`**

1. In the non-editing display view, remove the pencil button from the "Holding" row (it's currently wrapped in a `div` with `flex items-center gap-1.5` next to the holding value).

2. Add the pencil button to the "Estimated Costs" header row, next to the `h4` label -- placing it between the title and the "Include Exit Costs" toggle.

The header currently looks like:
```tsx
<div className="flex items-center justify-between">
  <h4 className="text-xs font-medium ...">Estimated Costs</h4>
  <div className="flex items-center gap-2">
    <Label ...>Include Exit Costs</Label>
    <Switch ... />
  </div>
</div>
```

It will become:
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-1.5">
    <h4 className="text-xs font-medium ...">Estimated Costs</h4>
    <button onClick={() => setIsEditingCosts(true)} ...>
      <Pencil className="h-3 w-3" />
    </button>
  </div>
  <div className="flex items-center gap-2">
    <Label ...>Include Exit Costs</Label>
    <Switch ... />
  </div>
</div>
```

The pencil only shows in the non-editing state (it's already hidden during editing since the "Done" button replaces it).

### Files
- **Edit**: `src/components/budget/DealSidebar.tsx`

