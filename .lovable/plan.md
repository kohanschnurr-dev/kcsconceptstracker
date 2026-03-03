

## Make Both Stat Card Rows Equal Width

Both rows already use the same grid class (`grid grid-cols-2 lg:grid-cols-4 gap-4`), so the grid itself is identical. The visual width inconsistency likely comes from the rows being separate `div` elements inside a `space-y-6` flex container — any slight content-driven sizing difference can appear.

### Fix

Wrap both rows in a single parent container so they share the same block formatting context, ensuring pixel-perfect alignment:

**File: `src/pages/ProjectBudget.tsx`**

1. Wrap the two grid rows (lines 676–863) in a single `<div className="space-y-4">` container so they're siblings within one box.
2. Ensure both grids use the exact same gap value (currently both `gap-4` — confirmed identical).
3. Add `min-w-0` to each `<Card>` in both rows to prevent any card from pushing its column wider due to long text content (e.g., "Remaining Construction Budget" label is longer than "Loan Costs").

This guarantees both rows' columns align exactly, regardless of content length.

| Location | Change |
|----------|--------|
| Lines 676–863 | Wrap both row divs in a shared parent `div` |
| Each `Card` in both rows | Add `min-w-0` to prevent text overflow from affecting column width |

