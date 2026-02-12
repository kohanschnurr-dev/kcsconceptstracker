

## Make Summary Cards Clickable to Filter Expenses

### Overview
Make the "Total Construction Budget", "Loan Costs", and "Holding Costs" cards in Row 1 clickable. Clicking one will:
1. Set the `selectedCostType` filter to the corresponding value (`construction`, `loan`, or `monthly`)
2. Scroll down to the expenses table so the user immediately sees the filtered results

Clicking the same card again (when already filtered) will reset the filter back to "all".

### Technical Details

**File: `src/pages/ProjectBudget.tsx`**

1. Add a `useRef` for the expenses table section (e.g., `expensesTableRef`) and attach it to the expenses table container element.

2. Create a helper function `handleCardFilter(costType: string)` that:
   - Toggles `selectedCostType` (if already set to that value, reset to `'all'`; otherwise set it)
   - Scrolls `expensesTableRef.current` into view with `behavior: 'smooth'`

3. Update three cards to be clickable with `cursor-pointer` and a visual active state (e.g., ring highlight when the corresponding filter is active):
   - **Total Construction Budget** card: filters to `'construction'`
   - **Loan Costs** card: filters to `'loan'`
   - **Holding Costs** card: filters to `'monthly'`

4. Add the `ref={expensesTableRef}` to the expenses table wrapper (the Collapsible or its parent div).

