

## Remove Category Label Chip from DealCard

The category badge ("Third Party", "Due Diligence", etc.) at the bottom of each card is redundant since the card's color and the legend already communicate the category. Removing it declutters the cards.

### Change

**`src/components/calendar/DealCard.tsx`** — Lines 123-135 (the bottom row with the category chip):

- Remove the category label `<span>` (lines 124-131) entirely.
- Keep the subtask count (`0/0 tasks`) but move it to stand alone, aligned right.
- Exception: keep the "Critical Path" label when `task.isCriticalPath && !task.isCompleted` — this is a status indicator, not a category.

Result: the bottom of each non-compact card shows only the task count (right-aligned), unless it's a critical path item which still shows the "Critical Path" badge.

