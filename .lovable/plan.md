
## Plan: Convert Bundle Assignment to Dropdown

### Overview

The "Assign to Bundles" field currently displays bundles as a grid of checkbox buttons. The user wants this converted to a standard dropdown multi-select pattern for a cleaner appearance.

---

### Current Implementation (lines 823-866)

The current code shows bundles as:
- A grid of checkboxes with bundle names
- Users click on checkbox items to toggle selection
- Selected bundles show as badges below the grid

```tsx
<div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-muted/30">
  {bundles.map(b => (
    <label className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
      <Checkbox ... />
      <span className="text-sm truncate">{b.name}</span>
    </label>
  ))}
</div>
```

---

### Technical Implementation

**File: `src/components/procurement/ProcurementItemModal.tsx`**

Replace the checkbox grid with a Popover-based multi-select dropdown that:
1. Shows a trigger button displaying selected bundle count or names
2. Opens a dropdown with checkboxes for each bundle
3. Allows multiple selection
4. Displays selected bundles as badges below (keep this part)

**Implementation approach:**

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-between">
      {formData.bundle_ids.length === 0 
        ? "Select bundles..." 
        : `${formData.bundle_ids.length} bundle(s) selected`}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-full p-2">
    {bundles.map(b => (
      <div key={b.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
        <Checkbox checked={...} onCheckedChange={...} />
        <span>{b.name}</span>
      </div>
    ))}
  </PopoverContent>
</Popover>
```

**Imports needed:**
- Add `ChevronDown` to lucide-react imports
- Add `Popover, PopoverTrigger, PopoverContent` imports

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/procurement/ProcurementItemModal.tsx` | Add Popover imports, add ChevronDown icon, replace checkbox grid with Popover dropdown |

---

### Result

The bundle assignment will appear as a clean dropdown button that:
- Shows "Select bundles..." when empty
- Shows "X bundle(s) selected" when bundles are chosen
- Opens a popover with checkbox list on click
- Keeps the badge display for selected bundles below
