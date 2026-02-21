

## Make Holding Costs Dynamic in the Report

### Problem
The holding costs calculation on line 135 works but the label just says "Holding Costs" without showing the percentage. More importantly, when `holdingPct` is `null` (no value saved on the project), the calculation silently produces `null` instead of falling back to the default 3%. The label should also reflect the mode/percentage like we did for transaction costs.

### Changes in `src/components/project/ProjectReport.tsx`

**1. Fix the `holdPerMonth` calculation to use the default fallback (line 135)**

Currently if `holdingPct` is null and mode is `'pct'`, the result is `null`. It should fall back to 3% (the app-wide default).

```
// Before:
const holdPerMonth = holdingMode === 'flat' && holdingFlat ? holdingFlat : (holdingPct && pp ? (holdingPct / 100) * pp / 12 : null);

// After:
const effectiveHoldingPct = holdingPct ?? 3;
const holdPerMonth = holdingMode === 'flat'
  ? (holdingFlat ?? 0)
  : (pp ? (effectiveHoldingPct / 100) * pp / 12 : null);
```

**2. Make the label dynamic (line 401)**

Show the actual percentage or "Flat" to match the transaction costs pattern.

```
// Before:
{dealField('Holding Costs', holdPerMonth)}

// After:
{dealField(
  holdingMode === 'flat'
    ? 'Holding Costs (Flat)'
    : `Holding Costs (${effectiveHoldingPct}%)`,
  holdPerMonth
)}
```

### Files Changed
- `src/components/project/ProjectReport.tsx`
