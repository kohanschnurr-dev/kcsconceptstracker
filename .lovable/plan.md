
## Factor Transaction and Holding Costs into Project Card Profit

### What Changes
The Profit value on project cards currently only calculates `ARV - Purchase Price - MAX(Budget, ConstructionSpent)`. It needs to also subtract Transaction Costs and Holding Costs, using each project's saved cost parameters (mode, percentage, flat amount, or actual expenses).

### How It Works
Each project stores its cost configuration:
- **Mode**: `pct` (percentage), `flat` (dollar amount), or `actual` (from expenses)
- **Parameters**: percentage values, flat amounts

The card will compute costs the same way the Profit Calculator does:
- Transaction Costs: based on mode -- `% of ARV`, flat `$`, or actual sum of `cost_type = 'transaction'` expenses
- Holding Costs: based on mode -- `% of Purchase Price`, flat `$`, or actual sum of `cost_type = 'monthly'` expenses

### Technical Changes

**1. `src/types/index.ts`** -- Add new optional fields to the `Project` interface:
- `closingCostsPct?: number`
- `closingCostsMode?: string`
- `closingCostsFlat?: number`
- `holdingCostsPct?: number`
- `holdingCostsMode?: string`
- `holdingCostsFlat?: number`
- `transactionCostActual?: number`
- `holdingCostActual?: number`

**2. `src/pages/Index.tsx`** -- In the project transform:
- Add per-project accumulators for `cost_type = 'transaction'` and `cost_type = 'monthly'` expenses (similar to the existing `constructionByProject`)
- Map the new cost fields from the DB columns into the Project object

**3. `src/pages/Projects.tsx`** -- Same changes as Index.tsx:
- Add transaction/holding expense accumulators per project
- Map the cost fields into the Project object

**4. `src/components/dashboard/ProjectCard.tsx`** -- Update profit calculation:
- Compute `closingCosts` and `holdingCosts` using the same mode logic as ProfitCalculator
- Subtract both from profit: `ARV - Purchase Price - rehabBasis - closingCosts - holdingCosts`

```text
Current:  profit = ARV - PP - MAX(budget, constructionSpent)
Updated:  profit = ARV - PP - MAX(budget, constructionSpent) - transactionCosts - holdingCosts
```
