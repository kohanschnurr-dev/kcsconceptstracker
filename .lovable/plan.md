

## Pull Transaction Costs % from Project Data

### Problem
The report hardcodes `sellingCostsPct = 6` (line 137) instead of reading the project's actual `closing_costs_pct` value. Your project has 4%, but the report always shows "Transaction Costs (6%)".

### Changes in `src/components/project/ProjectReport.tsx`

**1. Replace hardcoded percentage with project data (line 137)**
Read from the project's `closing_costs_pct`, `closing_costs_mode`, and `closing_costs_flat` fields -- same pattern used in `ProjectCard.tsx` and `ProfitBreakdown.tsx`.

```
// Before:
const sellingCostsPct = 6;
const sellingCosts = projectedSalePrice ? projectedSalePrice * sellingCostsPct / 100 : null;

// After:
const closingMode = project.closing_costs_mode ?? 'pct';
const closingPct = project.closing_costs_pct ?? 6;
const closingFlat = project.closing_costs_flat ?? 0;
const sellingCosts = projectedSalePrice
  ? closingMode === 'flat' ? closingFlat : projectedSalePrice * (closingPct / 100)
  : null;
```

**2. Make the label dynamic (line 405)**
Update the label to show the actual percentage (or "Flat" when in flat mode):

```
// Before:
{dealField('Transaction Costs (6%)', sellingCosts)}

// After:
{dealField(
  closingMode === 'flat'
    ? 'Transaction Costs (Flat)'
    : `Transaction Costs (${closingPct}%)`,
  sellingCosts
)}
```

### Files Changed
- `src/components/project/ProjectReport.tsx`
