

## Fix: Wrench Tooltip Not Showing Trades on Hover

### Problem
The tooltip on the wrench icon never appears because Lucide SVG icons don't properly forward refs when used directly with `asChild` on `TooltipTrigger`. The user only sees the "?" cursor but no tooltip content.

### Fix
**File: `src/components/project/ProjectVendors.tsx`** (lines 250-251)

Wrap the `Wrench` icon inside a `<span>` element so the `TooltipTrigger` has a proper DOM element to attach to:

```tsx
// Before
<TooltipTrigger asChild>
  <Wrench className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
</TooltipTrigger>

// After
<TooltipTrigger asChild>
  <span className="inline-flex cursor-help">
    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
  </span>
</TooltipTrigger>
```

Single two-line change. The tooltip will now properly display the comma-separated list of trades (e.g., "Bathroom, Carpentry, Demolition...") when hovering the wrench icon.
