
## Fix Cash-on-Cash Return for Infinite Return Scenarios

### Problem
When the loan fully covers (or exceeds) the cost basis, Cash Invested = $0 and Cash-on-Cash incorrectly shows 0.0%. This is actually an "infinite return" scenario that should display accordingly -- the BRRR Analysis tab already handles this correctly by showing the infinity symbol.

### Solution
Apply the same infinite return logic from `BRRRAnalysis.tsx` to `RentalAnalysis.tsx`: when Cash Invested is $0 (totalCashInvested <= 0), display "∞" for Cash-on-Cash instead of "0.0%", and style it green.

### Technical Details

**File: `src/components/budget/RentalAnalysis.tsx`**

Three locations need updating:

1. **Returns section (line ~129)** -- Change the Cash-on-Cash value display:
   - From: `{cashOnCash.toFixed(1)}%`
   - To: `{totalCashInvested <= 0 ? '∞' : `${cashOnCash.toFixed(1)}%`}`
   - Color should be green when infinite

2. **Summary card for Cash-on-Cash (line ~155)** -- Same change in the bottom summary banner:
   - From: `{cashOnCash.toFixed(1)}%`
   - To: `{totalCashInvested <= 0 ? '∞' : `${cashOnCash.toFixed(1)}%`}`
   - Background and text should be green when infinite

This mirrors exactly how `BRRRAnalysis.tsx` handles the `moneyLeftInDeal <= 0` case on lines 169 and 211.
