

## Use Actual Spent for Completed Projects' Profit

### Problem
Currently, the profit formula always uses `MAX(totalBudget, constructionSpent)` as the rehab basis. For completed projects, this is overly conservative -- if the project came in under budget, the profit should reflect the actual spend, not the higher planned budget.

### Change
When a project's status is `'complete'`, use `constructionSpent` (actual) instead of `MAX(budget, constructionSpent)` as the rehab basis.

```
Active:    profit = ARV - PP - MAX(budget, constructionSpent) - transaction - holding
Complete:  profit = ARV - PP - constructionSpent - transaction - holding
```

### Technical Changes

**`src/components/dashboard/ProjectCard.tsx`** (~line 30):
- Change the `rehabBasis` calculation from:
  ```ts
  const rehabBasis = Math.max(project.totalBudget, constructionSpent);
  ```
  to:
  ```ts
  const rehabBasis = project.status === 'complete'
    ? constructionSpent
    : Math.max(project.totalBudget, constructionSpent);
  ```

That is the only file that needs to change. The same component is used on both the Dashboard and Projects pages.

