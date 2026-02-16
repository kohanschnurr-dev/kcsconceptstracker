

## Add Points Cost Line Item to BRRR Analysis

### What Changes
Add a "Points" line item to the **Acquisition** section of the BRRR Analysis card, showing the dollar cost of refi points. This makes the cost visible in the P&L breakdown (currently it's factored into the Total All-In math but not shown as its own line).

### Technical Details

**File: `src/components/budget/BRRRAnalysis.tsx`**
1. After the "Closing + Holding" line (line 81) and before the "Total All-In" line (line 82), add a conditional row that shows "Points" and its dollar cost -- only when `refiPointsCost > 0`
2. No calculation changes needed; `refiPointsCost` is already computed and included in `totalAcquisitionCost`

```tsx
{refiPointsCost > 0 && (
  <div className="flex justify-between">
    <span>Points</span>
    <span className="font-mono">{formatCurrency(refiPointsCost)}</span>
  </div>
)}
```

One small addition to one file. No other changes required.

