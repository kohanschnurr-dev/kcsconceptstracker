

## Rename "Utilities" to "Monthly" + Custom Category List

### Overview

Rename the "Utilities" expense type to "Monthly" (displayed as "Monthly" in the UI) and replace the standard budget category dropdown with a dedicated list of recurring monthly cost categories when this type is selected.

### Changes

**1. `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**

- Rename all references of `'utilities'` to `'monthly'` in the type and state
- Change the Zap icon label from "Utilities" to "Monthly"
- When `selectedExpenseType === 'monthly'`, swap the category dropdown to show a dedicated monthly cost categories list instead of the standard budget categories:
  - Water, Gas, Electric, Insurance, HOA, Property Tax, Lawn Care, Pool Maintenance, Pest Control, Internet/Cable, Trash/Recycling, Security/Alarm
- The label next to the more button will show "Monthly" instead of "Utilities"

**2. `src/hooks/useQuickBooks.ts`**

- Update type from `'utilities'` to `'monthly'` in the `categorizeExpense` signature
- No logic change needed -- monthly costs still require a category and go into the budget like product/labor

**3. `src/components/QuickBooksIntegration.tsx`**

- Update the type in `handleCategorize` from `'utilities'` to `'monthly'`

**4. Monthly categories constant (in `GroupedPendingExpenseCard.tsx`)**

Add a local constant for the monthly cost categories:
```
MONTHLY_COST_CATEGORIES = [
  { value: 'water', label: 'Water' },
  { value: 'gas', label: 'Gas' },
  { value: 'electric', label: 'Electric' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'hoa', label: 'HOA' },
  { value: 'property_tax', label: 'Property Tax' },
  { value: 'lawn_care', label: 'Lawn Care' },
  { value: 'pool_maintenance', label: 'Pool Maintenance' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'internet_cable', label: 'Internet / Cable' },
  { value: 'trash_recycling', label: 'Trash / Recycling' },
  { value: 'security_alarm', label: 'Security / Alarm' },
]
```

When `selectedExpenseType === 'monthly'`, the category `Select` will use this list instead of `getCategoriesForProject()`. When switching back to product/labor, the normal category list returns.

### Technical Notes

- The `expense_type` column in the DB is a text field, so storing `'monthly'` requires no migration
- Monthly expenses still follow the same import flow as product/labor (category required, inserted into `expenses` with a `category_id`)
- The category values like `water`, `hoa`, `property_tax` will be stored as the category value. Since these may not exist as `project_categories` rows yet, the existing find-or-create logic in `useQuickBooks.ts` will handle creating them automatically
- No database changes needed

