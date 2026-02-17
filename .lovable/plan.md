

## Show "Multiple" for Items in 2+ Bundles with Hover Detail

### What's Changing
In the procurement table's Bundle column, when an item belongs to two or more bundles, it will display "Multiple" instead of listing them all. Hovering over "Multiple" will show a tooltip with the full list of bundle names.

### Technical Detail

**File: `src/pages/Procurement.tsx`**

1. Add Tooltip imports at the top:
```tsx
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
```

2. Replace the bundle cell rendering (lines 571-589) with logic that:
   - Shows "Unassigned" (italic, muted) if no bundles
   - Shows the single bundle name if exactly one bundle
   - Shows a "Multiple" badge wrapped in a `Tooltip` if 2+ bundles, with the tooltip content listing all bundle names

```tsx
<TableCell className="text-center">
  {(!item.bundle_ids || item.bundle_ids.length === 0) ? (
    <span className="text-sm text-muted-foreground italic">Unassigned</span>
  ) : item.bundle_ids.length === 1 ? (
    <div>
      <span className="text-sm">{getBundleNames(item.bundle_ids)[0]}</span>
      {getBundleProjectNames(item.bundle_ids).length > 0 && (
        <p className="text-xs text-muted-foreground">...</p>
      )}
    </div>
  ) : (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="secondary">Multiple</Badge>
      </TooltipTrigger>
      <TooltipContent>
        {getBundleNames(item.bundle_ids).map(name => <p>{name}</p>)}
      </TooltipContent>
    </Tooltip>
  )}
</TableCell>
```

3. Wrap the Table (or the entire return) with `<TooltipProvider>` so tooltips work.

### Files
- **Edit**: `src/pages/Procurement.tsx` -- Add tooltip imports, update bundle cell rendering, wrap with TooltipProvider
