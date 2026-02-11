

## Split "Permits & Inspections" into Separate Categories

### Problem
"Permits & Inspections" exists as a single combined category (`permits_inspections`) everywhere: the database enum, the hardcoded types, the group mapping, and existing project records. You added them as separate items in Settings (localStorage), but changes there don't propagate to:
- The database `budget_category` enum (which constrains `project_categories.category`)
- The hardcoded `BUDGET_CATEGORIES` array and `BudgetCategory` type in `src/types/index.ts`
- The trade group mapping in `budgetCalculatorCategories.ts`
- Existing project category records that reference `permits_inspections`

### Changes

**1. Database migration** -- Add new enum values and migrate existing data
```sql
-- Add new enum values
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'permits';
ALTER TYPE budget_category ADD VALUE IF NOT EXISTS 'inspections';

-- Migrate existing project_categories rows from old to new
-- (Split each permits_inspections row into two: permits + inspections)
-- We'll update the existing row to 'permits' and insert a new 'inspections' row
-- with a zero budget so no data is lost
```

A second migration (must be separate since new enum values aren't visible in the same transaction):
```sql
-- Update existing permits_inspections rows to permits
UPDATE project_categories SET category = 'permits' WHERE category = 'permits_inspections';

-- Insert corresponding inspections rows for each project that had permits_inspections
INSERT INTO project_categories (project_id, category, estimated_budget, user_id)
SELECT project_id, 'inspections', 0, user_id
FROM project_categories WHERE category = 'permits'
AND NOT EXISTS (
  SELECT 1 FROM project_categories pc2 
  WHERE pc2.project_id = project_categories.project_id 
  AND pc2.category = 'inspections'
);
```

**2. `src/types/index.ts`**
- In `BudgetCategory` type: remove `permits_inspections`, add `permits` and `inspections`
- In `BUDGET_CATEGORIES` array: replace `{ value: 'permits_inspections', label: 'Permits & Inspections' }` with `{ value: 'inspections', label: 'Inspections' }` and `{ value: 'permits', label: 'Permits' }` (alphabetically placed)
- In `VendorTrade` type: replace `permits_inspections` with `permits` and `inspections`

**3. `src/lib/budgetCalculatorCategories.ts`**
- Add `permits: 'other'` and `inspections: 'other'` to `CATEGORY_GROUP_MAP`
- Remove `permits_inspections` if present

**4. No other file changes needed**
- The Expense Detail modal's category dropdown pulls from project categories in the database, which will be migrated
- `getBudgetCategories()` reads from localStorage first; if the user already added separate entries there, those will be used. The hardcoded fallback is updated as backup
- `getBudgetCalcCategories()` derives from `getBudgetCategories()`, so it picks up changes automatically

### Technical Details

- Two separate migrations are required because PostgreSQL doesn't allow using newly added enum values in the same transaction
- Existing expenses linked to `permits_inspections` category rows via `category_id` (foreign key to `project_categories.id`) will automatically point to the updated "permits" category -- no expense records need changing
- The user can then reassign specific expenses to "inspections" using the category dropdown in the Expense Detail modal
