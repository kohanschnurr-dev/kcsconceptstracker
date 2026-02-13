

## Enforce A-Z Sorting on All Category Dropdowns

### Problem
Category dropdowns (like the one on the Budget tab) show items in insertion order rather than alphabetical order, especially after new categories are added.

### Solution
Sort categories alphabetically by label at the source getter functions, so every dropdown and consumer automatically gets A-Z ordered data without needing per-component sorting.

### Technical Changes

**1. `src/types/index.ts`** -- Sort `getBudgetCategories()` and `getBusinessExpenseCategories()` results by label:
- Add `.sort((a, b) => a.label.localeCompare(b.label))` to each function's return

**2. `src/lib/monthlyCategories.ts`** -- Sort `getMonthlyCategories()` results by label:
- Add `.sort((a, b) => a.label.localeCompare(b.label))` to the return

**3. `src/lib/calendarCategories.ts`** -- Sort `getCalendarCategories()` results by label:
- Add `.sort((a, b) => a.label.localeCompare(b.label))` to the return

This ensures all four category types are always A-Z sorted regardless of how they were stored or when items were added.
