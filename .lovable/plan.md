

## Restructure Row 2: Replace "Avg. Daily" with "Construction Costs"

### Overview
Replace the "Avg. Daily" card in Row 2 with a clickable "Construction Costs" card that shows actual spending on construction-type expenses. This gives you a clear breakdown of where money is going across all three cost types, alongside the total.

### Row 2 Layout (after change)
| Total Spent | # of Expenses | This Month | Construction Costs |
|---|---|---|---|

- **Construction Costs**: Sum of all expenses where `cost_type === 'construction'`. Clickable to filter + scroll to the expenses table (same behavior as Loan/Holding cards in Row 1).

### Technical Details

**File: `src/pages/ProjectBudget.tsx`**

1. **Add `constructionCosts` calculation** (near line 441, alongside `loanCosts`/`holdingCosts`):
   ```
   const constructionCosts = expenses.filter(e => e.cost_type === 'construction').reduce((sum, e) => sum + Number(e.amount), 0);
   ```

2. **Replace the "Avg. Daily" card** (lines 722-733) with a clickable "Construction Costs" card:
   - Uses `Hammer` icon (or similar from lucide-react)
   - Shows `constructionCosts` value
   - Clickable with `handleCardFilter('construction')` -- same toggle behavior as the existing construction budget card in Row 1
   - Active ring highlight when `selectedCostType === 'construction'`

3. **Remove `spendingAnalytics.avgDailySpending`** usage from Row 2 (the card and its "over X days" subtitle).

