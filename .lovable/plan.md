
## Add "Cash to Pocket" Metric to BRRR Analysis

### Problem
When the refinance loan amount exceeds the total acquisition cost (purchase + rehab + closing + holding + points), the investor pulls out excess cash. Currently, `Money Left In Deal` is clamped to $0 with `Math.max(0, ...)`, so you never see how much extra money you walked away with.

For example: $100k purchase + $10k rehab = $110k all-in, but you pull out $140k via refi -- you should see $30k cash to pocket.

### Solution
Add a **"Cash to Pocket"** line item in the Refinance column and a new summary card. This shows the excess cash extracted when the refi loan exceeds total costs.

### Technical Details

**File: `src/components/budget/BRRRAnalysis.tsx`**

1. **New calculation** (after line 36):
   - `cashToPocket = Math.max(0, refiLoanAmount - totalAcquisitionCost)` -- the inverse of moneyLeftInDeal

2. **Refinance column** -- add a new row after "Money Left In":
   - Label: "Cash to Pocket"
   - Show in green when > 0
   - Only displayed when cashToPocket > 0 (to keep the UI clean when it doesn't apply)

3. **Summary cards row** -- add a 5th card (adjust grid to `md:grid-cols-5`):
   - Title: "Cash to Pocket"
   - Green background when > 0, muted when $0
   - Positioned after "Money Left In" card

This gives immediate visibility into how much excess cash was extracted from the deal at refinance.
