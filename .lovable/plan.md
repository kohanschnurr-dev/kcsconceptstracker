
## Fix: Contractor Gross Profit on Project Card Shows Wrong Value

### Root Cause

There are two different `totalBudget` computations in the app:

**ProjectDetail.tsx (correct — used by Job P&L tab):**
```tsx
const categoryTotal = categories.reduce((sum, cat) => sum + cat.estimated_budget, 0);
const totalBudget = (project?.total_budget ?? 0) > 0 ? project!.total_budget : categoryTotal;
```
It prefers the `total_budget` DB column (set to $10,000) → Job P&L correctly shows Gross Profit = $15,000 - $10,000 = **$5,000**.

**Projects.tsx (broken — used to build the Project object for cards):**
```tsx
const calculatedTotalBudget = projectCategories.reduce(
  (sum, cat) => sum + cat.estimatedBudget, 0
);
// total_budget DB column is NEVER read
totalBudget: calculatedTotalBudget,
```
If no individual category budgets exist (just a top-level `total_budget`), `calculatedTotalBudget = 0`. This makes `contractorCostBasis = 0`, so the card shows Gross Profit = $15,000 - $0 = **$15,000** (wrong).

### The Fix — Two Files

**1. `src/pages/Projects.tsx`** — Use `total_budget` DB column with category-sum fallback (same pattern as ProjectDetail):

```tsx
const calculatedTotalBudget = projectCategories.reduce(
  (sum, cat) => sum + cat.estimatedBudget, 0
);
// Use project-level total_budget when set, else fall back to category sum
const effectiveTotalBudget = (p.total_budget ?? 0) > 0 ? p.total_budget : calculatedTotalBudget;

return {
  ...
  totalBudget: effectiveTotalBudget,  // was: calculatedTotalBudget
  ...
};
```

**2. `src/components/dashboard/ProjectCard.tsx`** — The status-aware gross profit logic (user's rule):

The card already applies the correct rule:
```
costBasis = totalBudget > 0 ? max(totalBudget, totalSpent) : totalSpent
```
- Active, expenses < budget → uses budget ✓
- Active, expenses > budget → uses expenses ✓
- Complete → should ALWAYS use expenses (actuals only)

The complete-project rule is missing. Add it:
```tsx
const contractorCostBasis = isContractor
  ? (project.status === 'complete'
      ? totalSpent                                                      // completed: always actuals
      : (project.totalBudget > 0
          ? Math.max(project.totalBudget, totalSpent)                   // active: max(budget, actuals)
          : totalSpent))                                                 // no budget set: actuals
  : 0;
```

### Files to Modify

| File | Change |
|---|---|
| `src/pages/Projects.tsx` | Read `p.total_budget` from DB and prefer it over category sum (matching ProjectDetail logic) |
| `src/components/dashboard/ProjectCard.tsx` | Add `status === 'complete'` branch to contractor cost basis so completed jobs always use actual spend |

No database changes. The `total_budget` column already exists and is already populated correctly.
