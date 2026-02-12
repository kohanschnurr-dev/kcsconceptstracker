

## Auto-Recognize New Categories System-Wide

### Problem
When you add a new expense category in Settings, some parts of the app still use a hardcoded list of categories instead of reading from the dynamic/custom list. This means new categories may not show up in dropdowns, label lookups, or other areas until someone manually updates the code.

### Solution
Replace all references to the static `BUDGET_CATEGORIES` constant with the dynamic `getBudgetCategories()` function across the entire codebase. This function already exists and reads from localStorage (where custom categories are stored), falling back to defaults. After this change, any category added in Settings will be instantly recognized everywhere.

### Files to Update (15 files)

Each file below will have its `BUDGET_CATEGORIES` import swapped to `getBudgetCategories` (and/or `getAllCategories`, `getBusinessExpenseCategories` as needed), and all usages updated to call the function instead of referencing the static array.

1. **src/components/project/ExpenseActions.tsx** -- category label lookups and dropdowns
2. **src/components/project/ProcurementTab.tsx** -- category label resolution
3. **src/components/project/ExportReports.tsx** -- export label resolution
4. **src/components/project/SpendingChart.tsx** -- chart label resolution
5. **src/components/project/BudgetAlerts.tsx** -- alert label resolution
6. **src/components/NewProjectModal.tsx** -- new project category seeding
7. **src/components/CreateBudgetModal.tsx** -- budget template category list
8. **src/components/SavedBudgetsPanel.tsx** -- saved budget label lookups
9. **src/components/dashboard/BudgetBreakdown.tsx** -- dashboard label lookups
10. **src/components/dashboard/VendorComplianceTable.tsx** -- vendor trade labels
11. **src/components/dashboard/RecentExpenses.tsx** -- recent expense labels
12. **src/pages/ProjectDetail.tsx** -- project detail category labels
13. **src/pages/Vendors.tsx** -- vendor trade labels
14. **src/pages/BudgetCalculator.tsx** -- calculator category list
15. **src/components/settings/ManageSourcesCard.tsx** -- already uses it for defaults, no functional change needed (only used as reset defaults)

### What Changes Per File
- Change `import { BUDGET_CATEGORIES }` to `import { getBudgetCategories }`
- Replace `BUDGET_CATEGORIES` usages with `getBudgetCategories()` calls
- For components that iterate the list (like `CreateBudgetModal`), store the result in a local variable to avoid repeated calls

### No Database or Backend Changes Needed
The dynamic getter already reads from localStorage, which is kept in sync with the cloud via the existing settings sync mechanism. This is purely a frontend consistency fix.

