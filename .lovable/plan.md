
## Replace Trade Badges with Hover Tooltip on Project Vendors

### Problem
The inline trade badge next to each vendor name takes up too much horizontal space, especially for vendors with many trades (e.g., Jose with 15+ trades). This clutters the card layout.

### Solution
Remove the visible Badge element and wrap the vendor name in a Tooltip. On hover, the tooltip will display the full list of trades. A small Wrench icon next to the name serves as a visual hint that trade info is available on hover.

### Technical Changes

**File: `src/components/project/ProjectVendors.tsx`**

1. Add Tooltip imports (`Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip`)
2. Replace the current Badge with trades next to vendor name:
   - Keep vendor name as-is
   - Add a small Wrench icon (h-3.5 w-3.5, muted color) next to the name
   - Wrap in a Tooltip that shows the comma-separated trade list on hover
3. Wrap the vendor list in a `TooltipProvider` so tooltips work
4. Remove the `Badge` import and `getTradeBadgeColor` helper if no longer used elsewhere

### Before
```
Jose  [wrench] Bathroom, Brick Siding Stucco, Carpentry, Demolition...
```

### After
```
Jose [wrench-icon]          <-- hover wrench to see trades
```
