

## Fix Dashboard Profit Potential to Match Breakdown Page

### Problem
The Dashboard "Profit Potential" card shows **$217,348** while the Profit Breakdown page shows **$140,353** for the same projects. The Dashboard calculation is missing **Transaction Costs** and **Holding Costs** from the profit formula.

### Root Cause
In `src/pages/Index.tsx` lines 289-296, the profit is calculated as:
```
ARV - Purchase Price - Construction Cost Basis
```

But the correct formula (used on the Breakdown page) is:
```
ARV - Purchase Price - Construction Cost Basis - Transaction Costs - Holding Costs
```

The data for transaction and holding costs is already available on each project object (e.g., `closingCostsMode`, `closingCostsPct`, `closingCostsFlat`, `transactionCostActual`, `holdingCostsMode`, etc.) -- it's just not being used in the calculation.

### Fix

**`src/pages/Index.tsx`** (lines 289-296):

Update the `totalProfitPotential` reducer to compute transaction and holding costs per project using the same mode-aware logic as the Breakdown page:

```typescript
const totalProfitPotential = filteredProfitProjects.reduce((sum, p) => {
  const arv = (p as any).arv || 0;
  const purchasePrice = (p as any).purchasePrice || 0;
  const plannedBudget = p.totalBudget;
  const constructionSpent = (p as any).constructionSpent || 0;
  const costBasis = p.status === 'complete'
    ? constructionSpent
    : Math.max(constructionSpent, plannedBudget);

  // Transaction costs (same logic as ProfitBreakdown)
  const closingMode = (p as any).closingCostsMode || 'pct';
  const transactionCosts = closingMode === 'actual'
    ? ((p as any).transactionCostActual || 0)
    : closingMode === 'flat'
      ? ((p as any).closingCostsFlat ?? 0)
      : arv * (((p as any).closingCostsPct ?? 6) / 100);

  // Holding costs (same logic as ProfitBreakdown)
  const holdingMode = (p as any).holdingCostsMode || 'pct';
  const holdingCosts = holdingMode === 'actual'
    ? ((p as any).holdingCostActual || 0)
    : holdingMode === 'flat'
      ? ((p as any).holdingCostsFlat ?? 0)
      : purchasePrice * (((p as any).holdingCostsPct ?? 3) / 100);

  return sum + (arv - purchasePrice - costBasis - transactionCosts - holdingCosts);
}, 0);
```

This also adds the `status === 'complete'` check for `costBasis` to match the Breakdown page logic.

### Files to Change
- **`src/pages/Index.tsx`** -- update `totalProfitPotential` calculation to include transaction costs, holding costs, and the completed-project cost basis logic
