
## Fix Profit Calculation: Use Budget as Cost Basis (with Actual Override)

### The Logic Change

Currently, the component calculates:
```
Gross Profit = Contract Value - totalSpent (actual expenses only)
```

The user wants the same logic as fix-and-flip projects, where the **cost basis** is whichever is higher — the estimated budget OR actual spend:

```
Cost Basis  = max(totalBudget, totalSpent)
Gross Profit = Contract Value - Cost Basis
Gross Margin = Gross Profit / Contract Value
```

This means:
- While a job is in progress (actuals below budget), the **budget is the cost floor** — profit is projected based on what you expect to spend
- Once actuals **exceed** the budget, the actual costs take over — profit erodes accordingly
- This gives a realistic, conservative projection at all times

### UI Updates

The **"Total Costs"** card will be updated to show the **Cost Basis** (the higher of budget vs. actual) rather than just raw actuals, with a sub-label that clarifies which is being used:

- If `totalSpent <= totalBudget`: label reads "Budget (est. job cost)"
- If `totalSpent > totalBudget`: label reads "Actual Costs (over budget)"

A small secondary line will show the raw actual spend for transparency: e.g. "Actual spend: $38,200"

The **"Gross Profit"** card sub-label will update to: `Contract Value − Est. Job Cost` or `Contract Value − Actual Costs` accordingly.

The **status pill** logic also updates:
- `totalSpent > contractValue` → "Over Contract" (red)
- `totalSpent > totalBudget && totalBudget > 0` → "Over Budget" (orange, actuals now driving the number)
- Otherwise → "On Budget" (green)

### Technical Changes

**File: `src/components/project/ContractorFinancialsTab.tsx`** — lines 49–53 (derived values block):

```tsx
// Current (wrong):
const grossProfit = contractValue - totalSpent;

// New (correct — mirrors fix-and-flip rehab basis logic):
const costBasis = totalBudget > 0
  ? Math.max(totalBudget, totalSpent)
  : totalSpent;
const usingActuals = totalSpent > totalBudget && totalBudget > 0;
const grossProfit = contractValue - costBasis;
const grossMarginPct = contractValue > 0 ? (grossProfit / contractValue) * 100 : 0;
```

Then the "Total Costs" card displays `costBasis` as the main figure with a contextual sub-label, and an optional secondary line showing `totalSpent` when they differ.

No database changes needed. Only `ContractorFinancialsTab.tsx` is modified.
