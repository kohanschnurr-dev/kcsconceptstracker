

## Add "Transaction Costs" as a 4th Cost Type

### What Changes

1. **Row 1 (summary cards)**: Reorder so the first row shows only cost-type cards: Construction Costs, Loan Costs, Holding Costs, and the new **Transaction Costs** -- all clickable filters
2. **Row 2**: Move **Total Spent** down to the second row (where Total Budget, Remaining, etc. live)
3. **New cost type**: Add `transaction` as a 4th cost type throughout the system -- in the type selector popover, the filter dropdown, the label function, and the summary calculation

### Technical Steps (all in `src/pages/ProjectBudget.tsx`)

**1. Add transaction cost calculation (near line 461)**
- Add: `const transactionCosts = expenses.filter(e => e.cost_type === 'transaction').reduce((sum, e) => sum + Number(e.amount), 0);`

**2. Update `getCostTypeLabel` (line 540-546)**
- Add case `'transaction': return 'Transaction';`

**3. Reorganize Row 1 cards (lines 649-695)**
- Remove "Total Spent" card from Row 1
- Keep Construction Costs, Loan Costs, Holding Costs
- Add new **Transaction Costs** card with a suitable icon (e.g., `Receipt` or `FileText`)
- All four cards are clickable filters

**4. Add "Total Spent" to Row 2 (line 697+)**
- Insert the Total Spent card as the first card in the existing Row 2 grid (before Total Budget)

**5. Update cost type popover options (line 1374)**
- Change `['construction', 'loan', 'monthly']` to `['construction', 'loan', 'monthly', 'transaction']`

**6. Update filter dropdown (lines 1238-1242)**
- Add `<SelectItem value="transaction">Transaction</SelectItem>`

