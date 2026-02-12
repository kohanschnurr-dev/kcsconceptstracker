
## Reorder Summary Cards

### New Layout

**Row 1:** Total Spent | Construction Costs | Loan Costs | Holding Costs
**Row 2:** Total Construction Budget | Remaining Construction Budget | This Month | # of Expenses

### Technical Details

**File: `src/pages/ProjectBudget.tsx` (lines 638-733)**

Rearrange the existing card blocks within the two grid rows:

**Row 1 (lines 638-690)** — reorder to:
1. Total Spent (currently in Row 2, position 1)
2. Construction Costs (currently in Row 2, position 4) — clickable, filters to `construction`
3. Loan Costs (currently in Row 1, position 3) — clickable, filters to `loan`
4. Holding Costs (currently in Row 1, position 4) — clickable, filters to `monthly`

**Row 2 (lines 692-733)** — reorder to:
1. Total Construction Budget (currently in Row 1, position 1) — clickable, filters to `construction`
2. Remaining Construction Budget (currently in Row 1, position 2) — not clickable
3. This Month (currently in Row 2, position 3) — not clickable
4. Number of Expenses (currently in Row 2, position 2) — not clickable

This is a pure reorder of existing card JSX blocks — no new logic or calculations needed.
