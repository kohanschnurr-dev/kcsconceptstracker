

## Clean Up Loan Term Buttons

### Changes (all in `src/components/project/HardMoneyLoanCalculator.tsx`)

**1. Remove the "(0.8)" from the To Date button**

Line 796: Change `To Date ({toDateMonths})` to just `To Date`.

**2. Make the term preset buttons wider**

Line 726: Add `min-w-[4rem]` to the className of each term preset button so they fill more of the available space instead of being tiny pills.

Also add the same `min-w-[4rem]` to the Custom button (line 738) and the To Date button (line 792) for visual consistency.

### Summary of line-level edits

- **Line 726**: `className="rounded-sm"` becomes `className="rounded-sm min-w-[4rem]"`
- **Line 738**: `className="rounded-sm"` becomes `className="rounded-sm min-w-[4rem]"`
- **Line 792**: `className="rounded-sm border-primary/50"` becomes `className="rounded-sm border-primary/50 min-w-[4rem]"`
- **Line 796**: `To Date ({toDateMonths})` becomes `To Date`

