

## Reorder Stat Cards and Filter Budgets to Active Projects Only

### Changes
**File: `src/pages/Index.tsx`**

Two modifications:

1. **Swap card order**: Move "Total Budget" before "This Month" in the stats grid so the layout reads: Total Budget | This Month | Loan Payments

2. **Filter budget stats to active projects only**: Currently `totalBudget` and `totalSpent` aggregate across ALL projects (including complete/on-hold). Change the calculation to use only active projects, so the numbers reflect current construction draw needs.

### Technical Details

**Card reorder** (around lines 199-217): Simply swap the two `<StatCard>` components so Total Budget renders first.

**Budget filtering** (around lines 160-163): Change:
```tsx
const totalBudget = projects.reduce(...)
const totalSpent = projects.reduce(...)
```
to:
```tsx
const totalBudget = activeProjects.reduce(...)
const totalSpent = activeProjects.reduce(...)
```

This uses the already-computed `activeProjects` array (which filters to `status === 'active'`) instead of the full `projects` array.

