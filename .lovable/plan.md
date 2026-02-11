

## Add "Manage Sources" Section to Settings

A new card on the Settings page that lets you view and customize the category lists used throughout the app -- calendar categories, budget categories, monthly expense types, business expense categories, and procurement stores.

### What You'll See

A new **"Manage Sources"** card (between Company Branding and Account) with collapsible sections for each category type:

1. **Calendar Categories** -- grouped by workflow phase (Acquisition/Admin, Structural/Exterior, etc.). Add or remove items within each group.
2. **Budget Categories** -- the 48-item master list used for project budgets and QuickBooks expense assignment.
3. **Monthly Expense Types** -- recurring costs like Water, Gas, Electric, HOA, etc.
4. **Business Expense Categories** -- categories specific to KCS Concepts overhead (CRM Software, Gas/Mileage, etc.).
5. **Procurement Stores** -- already has add/remove support via `useCustomStores`; this surfaces it in Settings too.

Each section will show the current items as removable chips/badges, with an input to add new ones. A "Reset to Defaults" button per section restores the original hardcoded list.

### Technical Details

**Storage**: localStorage per category type (same pattern as the existing `useCustomStores` hook). No database changes needed.

**New files:**
- `src/hooks/useCustomCategories.ts` -- generic hook similar to `useCustomStores` but parameterized by category type (calendar, budget, monthly, business). Each type gets its own localStorage key and default list.
- `src/components/settings/ManageSourcesCard.tsx` -- the UI card with collapsible accordion sections, chip display, add input, and reset button.

**Modified files:**
- `src/pages/Settings.tsx` -- import and render the new `ManageSourcesCard` between Company Branding and Account.
- `src/lib/calendarCategories.ts` -- export functions that check localStorage overrides before falling back to hardcoded defaults.
- `src/lib/monthlyCategories.ts` -- same pattern: check localStorage first.
- `src/types/index.ts` -- export getter functions for `BUDGET_CATEGORIES` and `BUSINESS_EXPENSE_CATEGORIES` that respect localStorage overrides.
- Components that consume these lists (BudgetCanvas, BusinessExpenses, QuickBooks cards, NewEventModal, etc.) -- update imports to use the dynamic getter functions instead of static arrays.

**UI behavior:**
- Each section uses an Accordion from Radix so only one is expanded at a time.
- Items shown as small badges with an "X" to remove.
- Simple text input + "Add" button to create new items.
- Calendar categories also let you pick which group the new item belongs to.
- "Reset to Defaults" button per section with a confirmation toast.
- Changes apply immediately (no need for the sticky Save bar since it's localStorage).

