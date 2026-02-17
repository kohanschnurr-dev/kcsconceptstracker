

## Fix NaN% Budget Progress for Zero-Budget Projects

### Problem
When a project has a $0 total budget (common for wholesaling deals with no expenses), the budget progress calculation divides by zero, resulting in "NaN%" being displayed on the project card.

### Solution
In `src/components/dashboard/ProjectCard.tsx`, add a guard so that when `totalBudget` is 0, the budget progress section is hidden entirely (similar to how rental projects already skip it). Wholesaling deals and any other project with no budget should not show a meaningless progress bar.

### File Changed

**`src/components/dashboard/ProjectCard.tsx`**
- Update the `showBudgetProgress` condition (around line 22) to also require `project.totalBudget > 0`:
  ```ts
  const showBudgetProgress = !isRental && project.totalBudget > 0;
  ```
- This single change hides the entire "Budget Progress" section (progress bar, NaN%, $0 spent / $0 total) when there is no budget, keeping the card clean for wholesaling or other zero-budget projects.

