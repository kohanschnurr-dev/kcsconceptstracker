

## Fix: Register Custom Categories Before QuickBooks Import

### Problem
When importing a QuickBooks expense and selecting a custom category (e.g., "Insurance"), the system tries to insert a `project_categories` row with that value. If the value hasn't been registered in the Postgres `budget_category` enum, the insert fails with "Failed to find category."

This is the same root cause we just fixed for CSV imports — the `add_budget_category` RPC call is missing before the insert.

### Solution
In `src/hooks/useQuickBooks.ts`, add a call to `supabase.rpc('add_budget_category', { new_value: categoryValue })` before attempting to insert into `project_categories`. This ensures the enum value exists in the database before the row is created.

### Technical Details

**File: `src/hooks/useQuickBooks.ts`**

In the `importExpense` function (around line 438), before the `project_categories` insert in the `else` branch:

```ts
// Before creating a new project_category, register the enum value
await supabase.rpc('add_budget_category', { new_value: categoryValue });

const { data: newCategory, error: createError } = await supabase
  .from('project_categories')
  .insert({
    project_id: projectId,
    category: categoryValue as BudgetCategory,
    estimated_budget: 0,
  })
  .select('id')
  .single();
```

This is the same one-line fix pattern used in the CSV import fix and in `ManageSourcesCard.tsx`.

### Files Modified
- `src/hooks/useQuickBooks.ts` — add RPC call before category insert

