

## Fix Weekly View Card Overflow

Task cards in the weekly calendar view are overflowing their day columns because the grid cells lack overflow containment and card text isn't constrained.

### Changes

**`src/components/calendar/WeeklyView.tsx`**
- Add `overflow-hidden` to the `DroppableDay` container so content stays within its column bounds.

**`src/components/calendar/DealCard.tsx`**
- Add `min-w-0 overflow-hidden` to the outer button in the non-compact variant so flex children truncate properly.
- Add `min-w-0` to the inner div wrapping title/project name so `truncate` works correctly within flex layouts.

These three class additions ensure cards never visually bleed into neighboring day columns.

