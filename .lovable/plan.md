
## Plan: Limit Trade Badges on Vendor Cards

### Problem
When a vendor has many trades (like Jose with 18+ categories), all badges are displayed, making the card excessively tall and cluttered.

### Solution
Limit the display to 5 trade badges and show a "+X more" badge for any remaining trades.

### Implementation

**File: `src/pages/Vendors.tsx`**

Update lines 181-192 to slice the trades array and add a count badge:

```tsx
<div className="flex flex-wrap gap-1 mt-1">
  {vendor.trades.slice(0, 5).map((trade) => (
    <Badge key={trade} variant="secondary" className="text-xs">
      {getTradeLabel(trade)}
    </Badge>
  ))}
  {vendor.trades.length > 5 && (
    <Badge variant="outline" className="text-xs">
      +{vendor.trades.length - 5} more
    </Badge>
  )}
  {vendor.trades.length === 0 && (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      No trades
    </Badge>
  )}
</div>
```

### Result

| Vendor | Before | After |
|--------|--------|-------|
| Jose (18 trades) | Shows all 18 badges | Shows 5 badges + "+13 more" |
| Connor Z (6 trades) | Shows all 6 badges | Shows 5 badges + "+1 more" |
| Frank (3 trades) | Shows all 3 badges | Shows all 3 badges (no change) |

This keeps cards compact and uniform in height while still indicating the full scope of each vendor's capabilities.
