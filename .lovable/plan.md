
## Use Only Construction Costs for Rehab Spent in Profit Calculator

### Problem
The Profit Calculator currently uses `totalSpent` (all expenses) as "Rehab Spent." Since closing and holding costs are already calculated as separate line items, using total spent double-counts any expenses categorized as loan, holding (monthly), or transaction costs.

### Solution
Compute a `constructionSpent` value that only sums expenses with `cost_type === 'construction'` (or null/undefined, which is the default). Pass this to the Profit Calculator instead of `totalSpent`.

### Technical Changes

**1. `src/pages/ProjectDetail.tsx`**

Add a construction-only spent calculation after the existing expense aggregation (around line 266-279):

```typescript
// Sum only construction expenses for profit calculator
const constructionOnlySpent = expensesData
  .filter(e => !e.cost_type || e.cost_type === 'construction')
  .reduce((sum, e) => sum + Number(e.amount), 0)
  + dedupedQbExpenses
  .filter(e => e.category_id && (!e.cost_type || e.cost_type === 'construction'))
  .reduce((sum, e) => sum + Number(e.amount), 0);
```

Store this in state and pass it to ProfitCalculator as `totalSpent` instead of the current `totalSpent` (which includes all cost types):

```tsx
<ProfitCalculator
  ...
  totalSpent={constructionSpent}  // was: totalSpent
  ...
/>
```

The existing `totalSpent` (all types) continues to be used everywhere else on the page (header cards, budget progress bar, etc.) -- only the Profit Calculator receives the filtered value.

**2. `src/components/project/ProfitCalculator.tsx`** -- No changes needed

The component already labels it "Rehab Spent" in the breakdown, which will now correctly reflect only construction costs.

### Also applies to the Dashboard Profit Breakdown

The same conservative formula used on `/profit` (Profit Breakdown page) and the dashboard stat card should also filter to construction-only. A quick check will confirm if those also need the same fix; if so, the same filtering logic will be applied there.
