

## Fix CSV Import: Register Custom Categories in DB Enum

### Problem
The import fails with `invalid input value for enum budget_category: "trims"` because the user's localStorage has custom category values (e.g., "trims" instead of "carpentry") that were never registered in the database's `budget_category` enum. The import tries to insert into `project_categories` with these values and the DB rejects them.

### Solution
Before inserting new `project_categories` rows, call the `add_budget_category` RPC for each category value that needs to be created. This registers the value in the Postgres enum so the insert succeeds.

### Changes

**File: `src/components/project/ImportExpensesModal.tsx`**

In the `handleImport` function (~line 355), before the `project_categories` insert, add a loop that registers each needed category value via the RPC:

```ts
// Register any custom category values in the DB enum first
if (neededCats.length > 0) {
  for (const cat of neededCats) {
    await supabase.rpc('add_budget_category', { new_value: cat });
  }

  // Then create the project_categories rows
  const { data: newCats, error: catError } = await supabase
    .from('project_categories')
    .insert(...)
    .select();
  // ... rest unchanged
}
```

This mirrors the pattern already used in `ManageSourcesCard.tsx` and `ReassignCategoryDialog.tsx`.

### Files Modified
- `src/components/project/ImportExpensesModal.tsx`
