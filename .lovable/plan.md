
## Group Budget Calculator Categories by Trade Group in Settings

### Problem
The Budget Calculator Categories in Settings currently show as a flat alphabetical list of badges. They should be visually grouped under their trade group headers (Structure, MEPs, Finishes, Kitchen & Bath, Exterior, Other) -- similar to how Calendar Categories are grouped.

### What Changes

**File: `src/components/settings/ManageSourcesCard.tsx`**

The rendering logic for budget calc groups exists (lines 83-106) but is unreachable because it sits inside the `if (grouped)` block, and the budget calc section only passes `budgetCalcGrouped` (not `grouped`). The fix:

1. Change the `renderItems` condition on ~line 57 from `if (grouped)` to `if (grouped || budgetCalcGrouped)` so the grouped rendering path is entered for budget calc categories too
2. Update the inner detection: when `budgetCalcGrouped` is true, skip the calendar group check and go straight to the budget calc group rendering (lines 83-106)

This is a one-line condition change that makes the existing grouped rendering code reachable for budget calc items.

### Result
Categories will display organized under group headers like:
- **Structure**: Demolition, Drywall, Foundation, Framing, Insulation, Roofing
- **MEPs**: Drain Line Repair, Electrical, Gas, HVAC, Plumbing, Water Heater
- **Finishes**: Doors, Flooring, Hardware, Light Fixtures, Painting, Tile, Windows
- etc.
