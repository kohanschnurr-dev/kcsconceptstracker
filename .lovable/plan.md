

## Auto-Scale SmartSplit Line Items to Match Transaction Total

### What This Fixes
When the AI parser misses a line item (or gets a price slightly wrong), the SmartSplit review screen shows a scary "Total mismatch detected" warning. In reality, the final import already scales amounts proportionally to the bank transaction total -- so the warning is misleading. This change makes the UI reflect what actually happens at import time.

### Approach
Apply a proportional scale factor to displayed line item prices whenever the parsed line items don't sum to the receipt subtotal. This silently adjusts prices so they always add up correctly, matching the existing pattern used in QuickExpenseModal.

### Technical Details

**File: `src/components/SmartSplitReceiptUpload.tsx`**

1. **Add a scaling helper** (~after `groupByCategory` at line 671)
   - Compute `rawTotal` from line items (sum of qty * unit_price)
   - Compute `targetTotal` = QB transaction amount (minus tax if tax is included separately)
   - If `rawTotal` differs from `targetTotal` by more than $0.01, calculate `scaleFactor = targetTotal / rawTotal`
   - Apply scale factor to each item's `unit_price` when displaying and when grouping

2. **Update the `groupByCategory` call and display** (~lines 706, 1230-1340)
   - Pass scaled unit prices into the category grouping logic
   - Update the line item display rows to show scaled prices
   - The scaled prices will naturally sum to the transaction amount

3. **Replace the mismatch warning with a subtle info note** (~lines 1359-1370)
   - Instead of the yellow "Total mismatch detected" warning, show a small info badge like "Prices adjusted to match transaction" only when scaling was applied
   - This tells the user what happened without alarming them

4. **Ensure rounding consistency**
   - Round each scaled price to 2 decimal places
   - Apply any rounding remainder (a few cents) to the largest category group to guarantee exact match

### Files to Change
- `src/components/SmartSplitReceiptUpload.tsx` -- all changes in this single file

