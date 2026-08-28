# Cost History Panel in the Budget Calculator

A fast lookup panel inside the Budget Calculator that answers two questions instantly: "what has this category actually cost me across past jobs?" and "what did this specific project spend?"

## Entry point

A new "Cost History" button in the Budget Calculator header toolbar (next to Load Template / Export PDF). It opens a right-side slide-over sheet, full height, so the budget stays visible behind it.

## Panel layout

**Top bar**
- Search box: type a category name (e.g. "roof", "cabinets") — instant fuzzy filter.
- Project toggle: a dropdown with "All Projects" plus every project (grouped by type, same component pattern already used for project pickers). Selecting one scopes everything below to that project.
- Status filter chips: All / Active / Completed.

**Summary strip** (updates with filters)
- Total actual spend, total budgeted, variance (over/under, colored), and average $/sqft where square footage exists.

**Results list**
- One row per category, sorted by actual spend descending. Each row shows:
  - Category label
  - Actual spent, Budgeted, Variance %
  - Number of projects it appears in
  - A thin bar showing actual vs budget
- Clicking a row expands it to a per-project breakdown: project name, budgeted, actual, $/sqft, and the project's status.

**Project mode**
- When a single project is selected, the list becomes that project's category breakdown, and the summary strip shows that project's totals against its budget.

**Empty / loading states**
- Skeleton rows while loading; a clean "No spend recorded for this category yet" message with the search term echoed.

## Behavior details

- Data covers all projects (active + completed), soft-deleted projects excluded.
- Actuals come from recorded expenses (including QuickBooks-imported ones), hidden expenses excluded; budgeted comes from each project's category budgets.
- Each result row gets a small "Use" action that writes the average actual for that category into the matching field in the current budget — this is the point of having it inside the calculator.
- Panel state (last search, last project selection) persists in localStorage for the session.

## Technical notes

- New hook `src/hooks/useCostHistory.ts`: one query for projects (id, name, status, sqft/type, deleted_at is null), one for `project_categories`, one for `expenses` (actual status, not hidden), plus `quickbooks_expenses` that are imported and assigned to a project/category. Aggregated client-side into `{ category, actual, budgeted, projects[] }`.
- New component `src/components/budget/CostHistoryPanel.tsx` using the existing Sheet primitive; project selector reuses `ProjectAutocomplete` with an added "All Projects" option.
- Category labels resolved via `getBudgetCategories()` so custom categories display correctly.
- Wire the trigger button into the header toolbar in `src/pages/BudgetCalculator.tsx`; the "Use" action calls the existing category-amount setter (respecting Labor/Material split mode by writing to Material, per current convention).
- Styling follows existing calculator tokens: sharp corners, 1px borders, gold accents, no hardcoded colors.
