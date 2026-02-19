
## Remove Budget Health Dots from Calendar Task Cards

### What They Are

The green circles on each task card are "budget health indicators" rendered in `src/components/calendar/DealCard.tsx`:

- **Compact card** (line 96): `<span className={cn('w-2 h-2 rounded-full ml-auto shrink-0', getBudgetIndicator(task.budgetHealth))} />`
- **Full card** (line 128): `<span className={cn('w-3 h-3 rounded-full shrink-0', getBudgetIndicator(task.budgetHealth))} />`

### Why They're Meaningless

In `ProjectCalendar.tsx`, every task is hardcoded with `budgetHealth: 'green' as const`. In `Calendar.tsx` (the main calendar page), a project budget health is calculated, but the dot is so small it's not a useful data signal — it just creates visual noise on every card with no label or tooltip to explain what the color means.

### The Fix

Remove both budget indicator `<span>` elements from `DealCard.tsx`:

1. **Compact view** (line 96) — remove the trailing dot `<span>` from the flex row
2. **Full card view** (line 128) — remove the dot `<span>` from the top-right of the card header

The `getBudgetIndicator` helper function can also be removed since nothing will use it.

### Files to Change

- `src/components/calendar/DealCard.tsx` only:
  - Remove `getBudgetIndicator` function (lines 69–75)
  - Remove compact dot `<span>` (line 96)
  - Remove full card dot `<span>` (line 128)

No other files need changes. The `budgetHealth` field can remain on the `CalendarTask` type in case it's used for future features.
