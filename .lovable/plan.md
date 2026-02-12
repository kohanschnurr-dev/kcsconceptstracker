
## Add "Loan Costs" and "Holding Costs" Cards to Budget Summary Row 1

### Overview
Add two new stat cards to the first row of the Budget summary grid, next to "Total Construction Budget" and "Remaining Construction Budget". These cards will aggregate expenses by `cost_type`:
- **Loan Costs**: sum of all expenses where `cost_type = 'loan'`
- **Holding Costs**: sum of all expenses where `cost_type = 'monthly'`

### Technical Details

**File: `src/pages/ProjectBudget.tsx`**

1. Add two computed values after existing stats (near the `remaining` calculation):
   - `loanCosts = expenses.filter(e => e.cost_type === 'loan').reduce(sum of amounts)`
   - `holdingCosts = expenses.filter(e => e.cost_type === 'monthly').reduce(sum of amounts)`

2. Import `Landmark` icon from lucide-react (for Loan Costs) and `Home` icon (for Holding Costs)

3. Update the Row 1 grid (currently `grid-cols-2 lg:grid-cols-4`) to include two new cards after "Remaining Construction Budget":
   - **Loan Costs** card with `Landmark` icon
   - **Holding Costs** card with `Home` icon

Both cards will use the same `glass-card` styling as the existing cards, with the value displayed in `font-mono` style.
