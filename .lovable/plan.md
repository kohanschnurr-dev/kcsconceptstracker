

## Plan: Fix Enum Registration Before Project Category Insert

### Problem
When creating a project with a saved budget template (e.g. "Farmers Branch Flip"), the template's `category_budgets` JSONB may contain custom categories like "architect" that aren't registered in the `budget_category` Postgres enum. The code inserts all categories from `getBudgetCategories()` into `project_categories` — if any of those include custom categories not yet in the enum, Postgres rejects the insert.

### Root Cause
`getBudgetCategories()` pulls from the user's custom category list (which may include "architect", etc.), but the code never calls `add_budget_category` RPC to register those values in the enum before inserting rows into `project_categories`.

### Fix

**File: `src/components/NewProjectModal.tsx`** — before the `project_categories` insert (~line 127)

Add a loop that registers every category value via the existing `add_budget_category` RPC before inserting:

```typescript
// Register all categories in the enum (handles custom ones)
const allCats = getBudgetCategories();
for (const cat of allCats) {
  await supabase.rpc('add_budget_category', { new_value: cat.value });
}
```

This is the same pattern already used elsewhere in the app (CSV imports, QuickBooks reconciliation, category management) per the project's existing convention documented in memory.

### Defensive Layer
Also add the same registration step when applying a saved budget template — iterate the keys of `selectedTemplate.category_budgets` (excluding `_meta`) and register each one. This covers cases where the template contains categories the user hasn't added to their local list yet.

### Files touched
- `src/components/NewProjectModal.tsx` (~5 lines added)

