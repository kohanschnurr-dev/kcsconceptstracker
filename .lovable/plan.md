

## Fix: No Projects Found in Budget Calculator "Apply" Section

### Problem
The "Apply to Project" dropdown shows "No projects found" because of a data mismatch:

1. The `BudgetCalculator` fetches projects with only `id, name, address` from the database
2. The `ProjectAutocomplete` component groups projects by `projectType` -- since that field is never fetched, every project gets filtered out of every group, resulting in an empty list

### Solution
Add `project_type` to the select query in `BudgetCalculator.tsx` and map it to `projectType` (camelCase) so the `ProjectAutocomplete` component can properly group and display the projects.

### Technical Detail

**File: `src/pages/BudgetCalculator.tsx`** (line 101)

Change the select query from:
```tsx
.select('id, name, address')
```
to:
```tsx
.select('id, name, address, project_type')
```

Then map the results to include the camelCase `projectType` property that `ProjectAutocomplete` expects:
```tsx
setProjects((data || []).map(p => ({
  ...p,
  projectType: p.project_type,
})));
```

This is a one-line query fix plus a small mapping -- the `ProjectAutocomplete` component and everything else stays unchanged.

