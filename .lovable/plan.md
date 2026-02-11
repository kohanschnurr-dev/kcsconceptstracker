

## Wire Up "Manage Sources" to the Entire App

Right now, the Manage Sources card saves your changes to localStorage, but the rest of the app still reads from the hardcoded default lists. This plan connects everything so that when you add/remove a category in Settings, every dropdown, label lookup, and filter across the platform reflects it immediately.

### What Changes

Every place that currently imports `BUDGET_CATEGORIES`, `BUSINESS_EXPENSE_CATEGORIES`, `CALENDAR_CATEGORIES`, `MONTHLY_COST_CATEGORIES`, or `ALL_CATEGORIES` as static arrays will be updated to call a dynamic getter function that checks localStorage first.

### Technical Details

**1. Add dynamic getter functions to each source module**

These functions read from localStorage (using the same keys the ManageSourcesCard writes to), falling back to the hardcoded defaults if nothing is saved.

- **`src/lib/calendarCategories.ts`** -- Add `getCalendarCategories()` function. Update the existing helper functions (`getCategoryGroup`, `getCategoryLabel`, `getCategoryStyles`, `getGroupedCategories`) to use this dynamic list instead of the static `CALENDAR_CATEGORIES` array.

- **`src/lib/monthlyCategories.ts`** -- Add `getMonthlyCategories()` function. Update `getMonthlyCategoryLabel` to use it.

- **`src/types/index.ts`** -- Add `getBudgetCategories()`, `getBusinessExpenseCategories()`, and `getAllCategories()` functions. Keep the static arrays as defaults but export the getters as the primary API.

**2. Update all consumer components (~20 files)**

Replace direct array references with getter function calls. For example:

```text
// Before
import { BUDGET_CATEGORIES } from '@/types';
const cats = BUDGET_CATEGORIES;

// After
import { getBudgetCategories } from '@/types';
const cats = getBudgetCategories();
```

Files to update:

- Calendar consumers (3 files):
  - `src/components/calendar/NewEventModal.tsx` -- `CALENDAR_CATEGORIES` to `getCalendarCategories()`
  - `src/components/calendar/TaskDetailPanel.tsx` -- `CALENDAR_CATEGORIES` to `getCalendarCategories()`
  - `src/components/calendar/CalendarLegend.tsx` -- no change needed (uses `CATEGORY_GROUPS` which stays static)

- Budget category consumers (8 files):
  - `src/components/budget/BudgetCanvas.tsx`
  - `src/components/project/CategoryBudgetModal.tsx`
  - `src/components/dashboard/SpendingDonutChart.tsx`
  - `src/components/project/StatDrilldownModal.tsx`
  - `src/pages/ProjectBudget.tsx`
  - `src/pages/Expenses.tsx`
  - `src/components/QuickExpenseModal.tsx`
  - `src/components/SmartSplitReceiptUpload.tsx`

- Business expense consumers (3 files):
  - `src/pages/BusinessExpenses.tsx`
  - `src/components/BusinessReceiptUpload.tsx`
  - `src/components/BusinessQuickBooksIntegration.tsx`
  - `src/components/BusinessExpenseDetailModal.tsx`

- Combined/ALL_CATEGORIES consumers (3 files):
  - `src/components/quickbooks/GroupedPendingExpenseCard.tsx`
  - `src/components/SplitExpenseModal.tsx`
  - `src/pages/Expenses.tsx`

- Monthly expense consumers (1 file):
  - `src/components/quickbooks/GroupedPendingExpenseCard.tsx`

**3. Update `VENDOR_TRADES` derivation**

In `src/types/index.ts`, `VENDOR_TRADES` is currently derived from the static `BUDGET_CATEGORIES`. Add a `getVendorTrades()` getter that derives from `getBudgetCategories()`.

**4. No database changes needed**

Everything stays in localStorage, matching the existing pattern for procurement stores.

### How It Works

```text
Settings Page                    Consumer Component
     |                                  |
     | (user adds "Septic")             |
     v                                  |
useCustomCategories hook               |
     |                                  |
     | saves to localStorage            |
     |   key: "custom-budget-categories" |
     v                                  v
localStorage  <-------- getBudgetCategories() reads from here
                         falls back to BUDGET_CATEGORIES defaults
```

Since components call the getter each render, any category added in Settings will appear in dropdowns the next time the user navigates to that page (or on re-render if on the same page).

### No breaking changes

The static arrays remain exported for backward compatibility and as default values. The getter functions are additive.
