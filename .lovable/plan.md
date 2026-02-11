
## Fix: Allow Creating New Categories During Reassignment

### The Problem

The `project_categories.category` column uses a Postgres enum (`budget_category`). When you type "Test" in the new category input, the code tries to insert `category: 'test'` into the table -- but Postgres rejects it because "test" isn't a valid enum value. That's the "Failed to reassign expenses" error.

### The Solution

Two changes are needed:

**1. New database function (migration)**

Create a Postgres function `add_budget_category(text)` that runs `ALTER TYPE budget_category ADD VALUE IF NOT EXISTS ...`. This function will use `SECURITY DEFINER` so it can modify the enum type even when called from the client.

```text
CREATE OR REPLACE FUNCTION public.add_budget_category(new_value text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TYPE public.budget_category ADD VALUE IF NOT EXISTS %L', new_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
```

**2. Update ReassignCategoryDialog.tsx**

Before inserting the new `project_categories` row, call the DB function to register the enum value first:

```typescript
if (isCreatingNew) {
  await supabase.rpc('add_budget_category', { new_value: resolvedTarget });
}
```

This single RPC call adds the value to the enum (or does nothing if it already exists), then the existing insert logic works as-is.

No other files need changes. The localStorage side (adding to the custom categories list) already works -- it's only the Postgres enum that was blocking.
