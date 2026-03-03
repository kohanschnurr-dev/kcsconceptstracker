

## Align Project Detail Summary Cards with Budget Page Style

The project detail page (image-880) shows cards with a different layout pattern (icon-box + label/value side by side) than the budget page (image-881) which uses a top-aligned icon + label row then value below. The user wants consistency when clicking through from the project overview to the budget page.

### Changes

**File: `src/pages/ProjectDetail.tsx` (lines 946-1027)**

Restyle the 4 summary cards to match the budget page layout:
- Replace the current horizontal icon-box + text layout with the budget page's vertical layout: small inline icon + label on top, large mono value below
- Use the same card structure: `<div className="flex items-center gap-2 mb-1">` for the icon+label row, then `<p className="text-2xl font-bold font-mono">` for the value
- Keep the same click behaviors (navigate to budget, switch to procurement tab)
- Keep the same color coding (primary for budget, warning for spent, success/destructive for remaining, muted for procurement)
- Remove the large 8x8/10x10 icon boxes; use small inline 4x4 icons like the budget page

This makes the project detail cards visually identical to Row 1 of the budget page, so navigating between pages feels cohesive.

