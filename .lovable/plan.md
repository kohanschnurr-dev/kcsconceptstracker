

## Fix Total Budget Calculation on Projects Page

The project cards are showing a static `total_budget` from the database instead of dynamically calculating it from category budgets. This causes the budget progress to be inaccurate when category budgets change.

---

## Current Problem

| Component | Issue |
|-----------|-------|
| Projects.tsx line 75 | Uses `p.total_budget` (static database field) |
| ProjectCard.tsx line 16 | Calculates percentage using `project.totalBudget` |

The Wales Rental shows $52,100 total, but this value doesn't update when you modify category budgets.

---

## Technical Fix

### File: `src/pages/Projects.tsx`

**Change the totalBudget calculation (line 71-88)**

Instead of:
```typescript
totalBudget: p.total_budget,
```

Calculate from category budgets:
```typescript
const projectCategories = (categoriesData || [])
  .filter((c: DBCategory) => c.project_id === p.id)
  .map((c: DBCategory) => ({
    id: c.id,
    projectId: c.project_id,
    category: c.category as CategoryBudget['category'],
    estimatedBudget: c.estimated_budget,
    actualSpent: expensesByCategory[c.id] || 0,
  }));

// Calculate total budget from sum of category estimated budgets
const calculatedTotalBudget = projectCategories.reduce(
  (sum, cat) => sum + cat.estimatedBudget, 
  0
);

return {
  id: p.id,
  name: p.name,
  address: p.address,
  totalBudget: calculatedTotalBudget,  // Dynamic calculation
  startDate: p.start_date,
  status: p.status === 'on_hold' ? 'on-hold' : p.status,
  projectType: p.project_type || 'fix_flip',
  categories: projectCategories,
};
```

---

## Result

- Total budget updates automatically when category budgets change
- Budget progress percentage reflects current category totals
- Remaining amount calculates correctly
- Consistent with how ProjectBudget.tsx already handles this

