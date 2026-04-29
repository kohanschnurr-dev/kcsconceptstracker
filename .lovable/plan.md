## Fix Payments Applied popover cutoff on Loan Detail

In `src/pages/LoanDetail.tsx`, the Balance breakdown popover has a fixed inner scroll area (`max-h-48`) and a narrow width (`w-80`), which clips the payments list with a tiny scrollbar (visible in screenshot).

### Change

`src/pages/LoanDetail.tsx` (line ~363, 371):
1. Make the **PopoverContent** itself scroll instead of a nested mini-scroller:
   - `w-80 p-3` → `w-96 p-3 max-h-[80vh] overflow-y-auto`
2. Remove the inner `max-h-48 overflow-y-auto` on the Payments Applied wrapper so payments expand naturally and the whole popover scrolls as one.

This eliminates the awkward inner scrollbar, widens the popover so amounts don't crowd the labels, and lets the user scroll through all payments while still seeing totals when they reach the bottom.

No other changes.
