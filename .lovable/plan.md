

## Align Profit Breakdown Page with Financials Tab Logic

### Problem
The Profit Breakdown table (`/profit`) calculates profit as `ARV - Purchase Price - MAX(budget, actual)` without factoring in Transaction Costs or Holding Costs, and without using actual spent for completed projects. This is inconsistent with the ProjectCard and Financials tab.

### Changes

**`src/pages/ProfitBreakdown.tsx`**

1. **Add transaction/holding expense accumulators** alongside existing monthly/construction accumulators:
   - Sum expenses with `cost_type = 'transaction'` per project
   - Sum expenses with `cost_type = 'monthly'` per project (already done for display, but needed for "actual" mode)

2. **Read each project's cost mode settings** from the DB row (`closing_costs_mode`, `closing_costs_pct`, `closing_costs_flat`, `holding_costs_mode`, `holding_costs_pct`, `holding_costs_flat`)

3. **Compute transaction and holding costs per project** using the same mode logic as ProjectCard:
   - `pct`: % of ARV (closing) or % of Purchase Price (holding)
   - `flat`: flat dollar amount
   - `actual`: sum of matching expenses

4. **Use actual spent for completed projects**: Change `costBasis` from always `MAX(budget, actual)` to using just `constructionSpent` when `status === 'complete'`

5. **Update profit formula**: `ARV - Purchase Price - costBasis - transactionCosts - holdingCosts`

6. **Add `transactionCosts` and `holdingCosts` fields** to the `ProjectProfit` interface so the table can display them if desired

### Updated Profit Logic
```text
Active:    profit = ARV - PP - MAX(budget, constructionSpent) - transactionCosts - holdingCosts
Complete:  profit = ARV - PP - constructionSpent - transactionCosts - holdingCosts
```

The table columns (Loan Costs, Monthly Costs) remain for display. The new transaction and holding costs will be factored into the Profit column without adding extra columns, keeping the table clean and matching the screenshot layout.

