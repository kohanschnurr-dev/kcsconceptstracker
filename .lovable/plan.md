
## Fix Missing Budget Progress Bar on 718 Chaparral Trail

### Problem

The dashboard project card for "718 Chaparral Trail" is missing its Budget Progress bar even though it's a Fix and Flip with a $67,209 total budget stored in the database. The root cause: the dashboard sums individual category estimated budgets to determine the total budget, but all of 718's category budgets are $0. The project's `total_budget` column ($67,209.96) is being ignored.

### Solution

Update the budget calculation in `src/pages/Index.tsx` to prioritize the `total_budget` database column, falling back to the sum of category budgets only when the DB value is missing or zero. This aligns with the project's existing convention used elsewhere in the app.

### Technical Details

**`src/pages/Index.tsx`** (~lines 149-159)

Current logic:
```tsx
const calculatedTotalBudget = projectCategories.reduce(
  (sum, cat) => sum + Number(cat.estimatedBudget), 0
);
// ...
totalBudget: calculatedTotalBudget,
```

Updated logic:
```tsx
const categorySumBudget = projectCategories.reduce(
  (sum, cat) => sum + Number(cat.estimatedBudget), 0
);
const calculatedTotalBudget = Number(p.total_budget) > 0
  ? Number(p.total_budget)
  : categorySumBudget;
// ...
totalBudget: calculatedTotalBudget,
```

This means:
- If the project has a `total_budget` value set (e.g. from the Budget Calculator), it uses that
- Otherwise it falls back to the sum of category-level budgets
- No other files need to change -- the ProjectCard already works correctly when `totalBudget > 0`

### Files Changed
- `src/pages/Index.tsx` -- prioritize `total_budget` DB column over category sum
