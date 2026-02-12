
## Redesign Budget Stats Cards

### Overview
Replace the current two rows of 4 stat cards (8 total) with a single redesigned set of 8 cards in two rows, showing the requested metrics.

### New Layout

**Row 1 (4 cards):**
1. **Total Construction Budget** -- sum of all category budgets (same as current "Total Budget")
2. **Remaining Construction Budget** -- budget minus construction spent (same as current "Remaining")
3. **Total Monthly Costs** -- sum of expenses where `expense_type = 'monthly'` for this project
4. **Total Loan Costs** -- sum of loan_payments for this project

**Row 2 (4 cards):**
5. **Total Spent** -- total spent across all types (construction + monthly + loan)
6. **# of Expenses** -- count of all expenses (same as current "Expenses")
7. **This Month** -- spending this calendar month (kept from current)
8. **Avg. Daily** -- average daily spending (kept from current)

**Removed:** "Last Month" and "This Week" cards.

### Technical Details

**File: `src/pages/ProjectBudget.tsx`**

1. **Fetch loan_payments data** -- add a query in `fetchData()` to pull from `loan_payments` table for this project and store the total.

2. **Calculate monthly costs** -- filter the existing expenses array for `expense_type === 'monthly'` and sum the amounts. Also include QB expenses that were imported as monthly type.

3. **Replace the two stat card grids** (lines 596-701) with the new 8-card layout:
   - Row 1: Total Construction Budget, Remaining Construction Budget, Total Monthly Costs, Total Loan Costs
   - Row 2: Total Spent, # of Expenses, This Month, Avg. Daily

4. **Update labels** -- rename "Total Budget" to "Total Construction Budget" and "Remaining" to "Remaining Construction Budget" for clarity.

5. **Remove unused analytics** -- drop `lastMonthSpending` and `thisWeekSpending` from the `spendingAnalytics` memo since those cards are being removed.
