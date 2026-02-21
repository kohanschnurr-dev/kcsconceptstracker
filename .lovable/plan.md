

## Rename Financial Labels in the Report

### Changes in `src/components/project/ProjectReport.tsx`

**1. Rename "Selling Costs (6%)" to "Transaction Costs (6%)"** (line 405)
Update the label passed to `dealField` from `'Selling Costs (6%)'` to `'Transaction Costs (6%)'`.

**2. Rename "Hold Costs / Month" to "Holding Costs"** (line 397)
Update the label from `'Hold Costs / Month'` to `'Holding Costs'` to match the standardized terminology used elsewhere in the app.

### Files Changed
- `src/components/project/ProjectReport.tsx`
