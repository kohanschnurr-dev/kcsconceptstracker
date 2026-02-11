

## Carry Over Budgets During Category Reassignment

When reassigning from "Foundation" to "Foundation Repair," the $5,000 budget attached to Foundation was lost because the code creates new category rows with a $0 budget. This fix will carry over the budget amounts.

### Changes

**File: `src/components/settings/ReassignCategoryDialog.tsx`**

1. **Fetch budget amounts** -- Update the `project_categories` query (line 52) to also select `estimated_budget`:
   ```
   .select('id, project_id, estimated_budget')
   ```
   Update the `categoryRows` state type to include `estimated_budget: number`.

2. **Carry over budget to new category** -- When creating a new `project_categories` row (line 140), use the old row's budget instead of 0:
   ```
   estimated_budget: oldRow.estimated_budget ?? 0
   ```

3. **Merge budget if target already exists** -- When the target category already exists for a project (line 136), add the old budget to the existing one via an update query so no budget value is lost.

These three small changes ensure that budget allocations transfer seamlessly when categories are renamed or merged.
