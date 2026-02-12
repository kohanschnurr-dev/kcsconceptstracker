

## Fix: Register Category Enum Before Querying

### Root Cause
The "Failed to find category" error occurs at the **query** step, not the insert step. When checking if a category already exists for a project, the SQL query uses `.eq('category', categoryValue)` — but if `categoryValue` isn't registered in the Postgres `budget_category` enum, the query itself fails with a type mismatch error.

The previous fix only added the RPC call before the **insert** (line 440), but the query on line 419-424 runs first and fails before we ever reach the insert.

### Fix
Move the `add_budget_category` RPC call to **before** the find query — so the enum value is guaranteed to exist before any database operation references it.

### Technical Details

**File: `src/hooks/useQuickBooks.ts`** (one change around lines 417-440)

Before:
```ts
if (categoryValue) {
  // Check if category already exists for this project
  const { data: existingCategory, error: findError } = await supabase
    .from('project_categories')
    .select('id')
    .eq('project_id', projectId)
    .eq('category', categoryValue as BudgetCategory)
    .maybeSingle();
```

After:
```ts
if (categoryValue) {
  // Ensure the enum value exists before any DB query referencing it
  await supabase.rpc('add_budget_category', { new_value: categoryValue });

  // Check if category already exists for this project
  const { data: existingCategory, error: findError } = await supabase
    .from('project_categories')
    .select('id')
    .eq('project_id', projectId)
    .eq('category', categoryValue as BudgetCategory)
    .maybeSingle();
```

And remove the now-redundant RPC call on line 440 (inside the else branch).

### Files Modified
- `src/hooks/useQuickBooks.ts` — move RPC registration before the find query

