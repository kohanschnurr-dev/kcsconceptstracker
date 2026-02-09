

## Add Monthly Costs Section to Project Detail Page

### Overview

Add a new "Monthly Costs" card/section to the project detail page that aggregates and displays all expenses with `expense_type = 'monthly'` for that project. This gives users a clear view of recurring holding costs like water, gas, insurance, HOA, property tax, etc.

### Placement

The section will be added as a new collapsible card between the Budget Progress bar and the Tabs section on the project detail page. It will show a summary of total monthly costs and a breakdown by category (water, gas, insurance, etc.).

### UI Design

A compact card with:
- Header: "Monthly Costs" with a calendar/repeat icon and total monthly spend
- A grid of category pills showing each monthly cost type and its total amount
- Collapsible detail rows showing individual expenses per category
- If no monthly expenses exist, the section is hidden entirely (no empty state clutter)

```text
+----------------------------------------------------------+
| Monthly Costs                          Total: $1,245.00   |
|----------------------------------------------------------|
| [Water $85] [Gas $120] [Insurance $450] [HOA $200] ...   |
|                                                          |
| > Expand to see individual transactions                  |
+----------------------------------------------------------+
```

### Technical Changes

**1. `src/pages/ProjectDetail.tsx`**

- Query expenses with `expense_type = 'monthly'` for this project from the `expenses` table
- These are already fetched in the existing `expensesRes` query -- just filter by `expense_type`
- Create a new `MonthlyExpenses` component (or inline section) that:
  - Groups monthly expenses by their category value (water, gas, insurance, etc.)
  - Shows total per category and overall total
  - Uses the same `MONTHLY_COST_CATEGORIES` constant from `GroupedPendingExpenseCard.tsx` (will extract to a shared location)
  - Collapsible to show/hide individual line items

**2. New file: `src/components/project/MonthlyExpenses.tsx`**

- Accepts `projectId` as prop
- Fetches expenses where `expense_type = 'monthly'` for the project
- Groups by category label
- Renders a compact card with category breakdown
- Each category row shows: icon, label, total amount, and expandable transaction list
- Supports deleting / sending back individual monthly expenses

**3. `src/lib/monthlyCategories.ts` (new shared constant file)**

Extract the `MONTHLY_COST_CATEGORIES` array from `GroupedPendingExpenseCard.tsx` into a shared file so both the QB import card and the project detail section can reference it:

```
export const MONTHLY_COST_CATEGORIES = [
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
];
```

**4. Update `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**

Import `MONTHLY_COST_CATEGORIES` from the shared file instead of defining it locally.

### Data Flow

- Monthly expenses are stored in the `expenses` table with `expense_type = 'monthly'`
- The category value (e.g., `water`, `insurance`) is stored in the `category_id` field, which references a `project_categories` row auto-created during QB import
- The `MonthlyExpenses` component queries expenses + joins category data to display human-readable labels
- No new database tables or columns needed

### No database changes required
All data already exists in the `expenses` table via the `expense_type` column.
