

## Rename "Closing Costs" to "Transaction Costs" and Add "Actual" Mode

### Overview
Two changes to the Profit Calculator:
1. Rename all instances of "Closing Costs" to "Transaction Costs"
2. Add a third toggle mode (besides % and $) for both Transaction Costs and Holding Costs -- an "Actual" mode that pulls the real expense totals from the project's categorized expenses

### How the "Actual" Mode Works
When the user selects the third button, the input field becomes read-only and displays the sum of expenses with `cost_type = 'transaction'` or `cost_type = 'monthly'` respectively. This pulls the same values shown on the budget page's summary cards.

### Technical Changes

**1. `src/components/project/ProfitCalculator.tsx`**
- Change the `CostMode` type from `'pct' | 'flat'` to `'pct' | 'flat' | 'actual'`
- Add two new props: `transactionCostActual` and `holdingCostActual` (the real expense sums)
- Rename all "Closing Costs" labels to "Transaction Costs"
- Update the toggle button to cycle through three modes: `%`, `$`, and a third icon (e.g., a list/receipt icon representing "Actual" from project data)
- When mode is `'actual'`, the input is disabled/read-only and shows the passed-in actual amount
- Update the cost calculation: `closingCosts` becomes `closingMode === 'actual' ? transactionCostActual : closingMode === 'pct' ? ... : closingFlat`
- Same pattern for holding costs
- Update `handleSave` to persist the new mode value
- Update breakdown panel labels from "Closing Costs" to "Transaction Costs"

**2. `src/pages/ProjectDetail.tsx`**
- Compute `transactionCostActual` by summing expenses where `cost_type === 'transaction'`
- Compute `holdingCostActual` by summing expenses where `cost_type === 'monthly'`
- Pass both values as new props to `ProfitCalculator`

**3. Database** -- No migration needed. The `closing_costs_mode` and `holding_costs_mode` columns are already plain `string` type, so storing `'actual'` works without schema changes.

### UI Toggle Design
The three-way toggle will look like:
```text
[ % | $ | A ]
```
Where "A" stands for "Actual" -- when selected, the input becomes read-only and shows the real project expense total. A helper text below will say something like "from project expenses = $X,XXX".
