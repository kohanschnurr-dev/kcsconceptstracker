

## Unify Cost Type Column to Badge-Style UI

### Problem
Manual expenses show a bordered `Select` dropdown with a chevron arrow, while QuickBooks expenses show a clean `Badge`. The inconsistency looks messy.

### Solution
Replace the `Select` dropdown for manual expenses with a clickable `Badge` that matches the QuickBooks badge style. When clicked, show a small `Popover` with three options (Construction, Loan, Monthly) to change the type. All rows will look identical -- clean badge, no dropdown chrome.

### Technical Details

**File: `src/pages/ProjectBudget.tsx`**

Replace the current conditional rendering (lines 1195-1214) so both manual and QB expenses render as a `Badge`. For manual expenses (and QB expenses that have a linked record), the badge will be wrapped in a `Popover` trigger. Clicking it opens a minimal popover with three buttons to pick the type.

The badge color will subtly vary by type:
- Construction: default outline badge
- Loan: secondary variant
- Monthly: secondary variant

Clicking a type in the popover updates the database, closes the popover, and refreshes the row -- same `handleCostTypeChange` logic already in place.

Imports needed: `Popover`, `PopoverTrigger`, `PopoverContent` from the existing UI components.

Remove the `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` imports if no longer used elsewhere in the file.

