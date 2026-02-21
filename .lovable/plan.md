

## Fix Holding Costs Display Value

### Problem
The report shows Holding Costs as $257 (the monthly figure) because the formula divides by 12. But the rest of the app -- Dashboard, Profit Breakdown, ProjectCard -- all display the **total** holding cost: `purchasePrice x holdingPct%`. For a $154K purchase at 2%, that's ~$3,080, which is what you expect to see.

### Changes in `src/components/project/ProjectReport.tsx`

**1. Add a total holding cost variable and use it for display (around line 135)**

Keep `holdPerMonth` for the cost basis calculation (which multiplies by months), but add a separate `holdingCostsTotal` for what gets shown in the Deal Financials section:

```
// Keep existing monthly calc for cost basis:
const holdPerMonth = holdingMode === 'flat'
  ? (holdingFlat ?? 0)
  : (pp ? (effectiveHoldingPct / 100) * pp / 12 : null);

// Add total for display (matches Profit Breakdown logic):
const holdingCostsTotal = holdingMode === 'flat'
  ? (holdingFlat ?? 0)
  : (pp ? (effectiveHoldingPct / 100) * pp : null);
```

**2. Update the dealField call (around line 401)**

Pass `holdingCostsTotal` instead of `holdPerMonth` so the displayed value matches the $3,000+ range:

```
{dealField(
  holdingMode === 'flat'
    ? 'Holding Costs (Flat)'
    : `Holding Costs (${effectiveHoldingPct}%)`,
  holdingCostsTotal   // <-- was holdPerMonth
)}
```

### Why This Works
- The cost basis calculation still uses the monthly figure multiplied by hold period months -- no change there.
- The displayed "Holding Costs" value now matches every other financial view in the app.

### Files Changed
- `src/components/project/ProjectReport.tsx`

