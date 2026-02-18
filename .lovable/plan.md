
## Fix Budget Category Allocation on Project Creation

### The Problem
When you create a new project with a total budget (e.g., $10,000), the system divides it **evenly across all 51 expense categories** -- giving each one ~$196. This creates a noisy, unhelpful "Budget by Category" view where every category has the same meaningless amount.

### The Fix
Stop auto-allocating the total budget across categories at project creation. Instead:

1. **Create the project with** `total_budget` **set as entered** (unchanged)
2. **Create project categories with $0 estimated budget** -- they exist as containers for future expenses, but no budget is pre-allocated
3. The "Budget by Category" section will show $0 for each category until you either:
   - Manually set budgets per category via "Add Category" / edit
   - Apply a budget from the Budget Calculator (which sends specific per-category amounts)

This way, the total budget lives at the project level as your high-level number, and category-level budgets only appear when you intentionally assign them.

### Technical Details

**File: `src/components/NewProjectModal.tsx` (lines 84-91)**

Current code:
```ts
const allCats = getBudgetCategories();
const budgetPerCategory = parseFloat(totalBudget) / allCats.length;
const categories = allCats.map(cat => ({
  project_id: project.id,
  category: cat.value,
  estimated_budget: Math.round(budgetPerCategory),
}));
```

Changed to:
```ts
const allCats = getBudgetCategories();
const categories = allCats.map(cat => ({
  project_id: project.id,
  category: cat.value,
  estimated_budget: 0,
}));
```

No other files need changes -- the existing `totalBudget` logic in `ProjectBudget.tsx` already handles the case where `project.total_budget > 0` and category totals are $0 (it uses the project-level total as the display budget).
