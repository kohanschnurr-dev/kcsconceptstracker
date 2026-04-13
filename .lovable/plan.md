

## Fix ROI Logic — Use Budget-Based ROI Until Spending Exceeds Budget or Project Completed

### Problem
ROI currently uses `currentProfit / currentInvestment` where `currentInvestment = purchasePrice + totalSpent`. Early in a project when spending is low, this produces an artificially inflated ROI (e.g. 510%) because most of the budget hasn't been spent yet.

### Logic Change
ROI should default to **budget-based** calculation and only switch to **current/spent-based** when:
1. `totalSpent > totalBudget` (over budget), OR
2. Project status is `'complete'`

### Changes

**`src/components/project/ProfitCalculator.tsx`**
- Add `projectStatus?: string` prop
- Change ROI calculation logic:
  - If `projectStatus === 'complete'` OR `totalSpent > totalBudget`: use current (spent-based) ROI → `currentProfit / currentInvestment`
  - Otherwise: use estimated (budget-based) ROI → `estimatedProfit / estimatedInvestment`
- Update the ROI card subtitle from "on current" to "on budget" or "on current" depending on which mode is active
- Update the ROI breakdown panel to show the matching profit/investment values

**`src/pages/ProjectDetail.tsx`**
- Pass `projectStatus={project.status}` to the `ProfitCalculator` component

Two files, ~10 lines changed.

