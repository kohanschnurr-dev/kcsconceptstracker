

## Fix Budget Progress to Use Calculated Total Budget

The Budget Progress bar is showing **$38,581 / $52,100** instead of **$38,581 / $60,575** because it references `project.total_budget` (the outdated database field) rather than the dynamically calculated `totalBudget` (sum of all category budgets).

---

## Root Cause

Line 496 in `ProjectDetail.tsx`:
```tsx
<span className="font-mono">{formatCurrency(totalSpent)} / {formatCurrency(project.total_budget)}</span>
```

This should use the `totalBudget` variable defined on line 170, which correctly sums all category budgets and is already used for the stat cards.

---

## Changes Required

**File: `src/pages/ProjectDetail.tsx`**

| Line | Current | Change To |
|------|---------|-----------|
| 496 | `project.total_budget` | `totalBudget` |
| 542 | `totalBudget={project.total_budget}` | `totalBudget={totalBudget}` |
| 547 | `totalBudget={project.total_budget}` | `totalBudget={totalBudget}` |
| 556 | `total_budget: project.total_budget` | `total_budget: totalBudget` |

This ensures consistency across:
- Stat cards (already correct)
- Budget Progress bar (fix)
- ProfitCalculator component (fix)
- SpendingChart component (fix)
- ExportReports component (fix)

---

## Summary

A single-file change to replace 4 occurrences of `project.total_budget` with the calculated `totalBudget` variable, ensuring mathematical consistency throughout the Project Detail page.

