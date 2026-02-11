
## Fix: Include QuickBooks Expenses in Category Reassignment Check

### The Problem

The "Remove Category" dialog only checks the `expenses` table for linked records. But your Foundation expenses are stored in the `quickbooks_expenses` table (imported bank transactions). So the dialog reports "0 expenses" even though there are 2 Foundation transactions totaling $5,000.

### The Fix

**File: `src/components/settings/ReassignCategoryDialog.tsx`**

Update the database check logic to also query `quickbooks_expenses` by `category_id`, and include those in the reassignment flow:

1. **Count phase**: After counting rows in `expenses`, also count rows in `quickbooks_expenses` that share the same `category_id` values. Display the combined total.
2. **Reassignment phase**: When moving expenses to a new category, also update `quickbooks_expenses.category_id` from the old project_category ID to the new one.
3. **Display**: Show a combined count (e.g., "7 expense(s) are assigned to this category") so the user sees the full picture.

### Specific Changes

In the `useEffect` that runs on dialog open:
- After counting `expenses` with `.in('category_id', ids)`, add a second query: count `quickbooks_expenses` with `.in('category_id', ids)`
- Sum both counts into `expenseCount`

In `handleConfirm`:
- After the line that updates `expenses.category_id`, add a matching update for `quickbooks_expenses.category_id` using the same old-to-new ID mapping

No new files, no schema changes -- just two additional Supabase queries in the existing dialog component.
