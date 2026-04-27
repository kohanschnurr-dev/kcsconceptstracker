## Problem

When the Balance stat card is clicked on the Loan Detail page, the popover (320px wide) opens centered on the card. Because the stat card is narrower than the popover, it spills sideways and visually cuts into the adjacent "Interest Accrued" / "Live th..." card on the left, making everything underneath look chopped off.

## Fix

In `src/pages/LoanDetail.tsx`, update the `<PopoverContent>` for the Balance card so it anchors cleanly under the trigger and doesn't crash into neighboring cards.

Changes:
- Set `align="end"` so the popover hugs the right edge of the Balance card (the rightmost stat) instead of spilling left over the other cards.
- Add `collisionPadding={16}` so it auto-flips/shifts before touching the viewport edge.
- Bump `sideOffset` to `8` for a touch more breathing room from the trigger card.

Result: the payment ledger popover sits cleanly beside/below its card with no visual overlap on adjacent stats.

## Technical detail

```tsx
<PopoverContent
  align="end"
  sideOffset={8}
  collisionPadding={16}
  className="w-80 p-3"
>
  ...
</PopoverContent>
```

No layout, sizing, or content changes — purely positioning.