I’ll fix the loan view switcher so the three buttons behave as three independent views:

1. Make the three view buttons mutually exclusive
   - Table / By Line will set flat table mode.
   - Cards will set card mode.
   - By Group will set grouped table mode.
   - Clicking Table after By Group will always return to the normal ungrouped line table.

2. Remove selected/highlighted styling from the view buttons
   - No view button will show the gold/primary selected background.
   - Buttons will only use neutral styling with hover feedback.
   - This removes the appearance of two selected buttons at once.

3. Rework the default-star behavior to match the three solo views
   - Default view will be stored as a single value: table, cards, or group.
   - Only one default star can exist at a time.
   - The star will only be permanently visible on the one saved default view; other stars appear only when hovering that specific button.

Technical details:
- Update `src/components/loans/LoanTable.tsx`.
- Replace the current combined `{ viewMode, groupByProject }` default model with a single logical view mode for the toggle: `table | cards | group`.
- Keep the existing table/card rendering logic, but derive `viewMode` and `groupByProject` from the single selected view when needed.
- Preserve backwards compatibility with the existing `loans:defaultView` localStorage value so users with old saved defaults still load correctly.