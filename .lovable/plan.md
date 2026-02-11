

## Reassign Expenses When Deleting an Expense Category

### What Changes

When you click the X to remove an expense category from the Settings page, the app will first check if any project budget categories and expenses use that category. If expenses exist, a dialog will appear asking you to reassign those expenses to a different category before the deletion proceeds.

### Flow

1. Click X on a category badge (e.g., "Painting")
2. App checks the database for any `project_categories` rows with that category value, and counts associated expenses
3. **If expenses exist**: A reassignment dialog appears showing how many expenses are affected, with a dropdown to pick a new category. On confirm, expenses are moved to the new category in the database, old project_categories rows are cleaned up, and the category is removed from the master list.
4. **If no expenses but project_categories exist**: A simpler confirmation appears, then removes the project_categories rows and the category from the list.
5. **If no database usage at all**: Removes immediately from the master list (current behavior).

### Technical Details

**New Component: `src/components/settings/ReassignCategoryDialog.tsx`**
- A Dialog component that:
  - Accepts the category being deleted (value + label), the list of remaining categories, and callbacks
  - On open, queries the database: counts `project_categories` rows and `expenses` using that category value
  - Shows the count of affected expenses
  - Provides a Select dropdown of remaining categories to reassign to
  - On confirm:
    1. For each project that has the old category, find or create a `project_categories` row for the new category
    2. Update all `expenses.category_id` from old category IDs to new category IDs
    3. Delete the old `project_categories` rows
    4. Call the `onRemove` callback to remove from localStorage
  - On cancel: does nothing

**Modified: `src/components/settings/ManageSourcesCard.tsx`**
- Add state for the category pending deletion and a dialog open flag
- For the "budget" (Expense Categories) section, instead of calling `onRemove` directly, intercept the click to open the `ReassignCategoryDialog`
- Pass the remaining categories list and the budget hook's `removeItem` as the final callback
- The `CategorySection` component will accept an optional `onBeforeRemove` prop; when provided, it calls that instead of `onRemove` directly

**No database schema changes needed** -- all operations use existing tables (`project_categories`, `expenses`) with existing columns.

