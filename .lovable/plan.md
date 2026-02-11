

## Remove Quick Log Expense FAB from Dashboard

Remove the floating "+" button (QuickActionButton) from the bottom-right corner of the dashboard page.

### Changes

**File: `src/pages/Index.tsx`**
- Remove the `<QuickActionButton>` component and its `onClick` handler
- Remove the `QuickExpenseModal` component and related state (`expenseModalOpen`, `setExpenseModalOpen`)
- Remove unused imports: `QuickActionButton`, `QuickExpenseModal`

No other files are affected. The `QuickActionButton` component file itself can stay in the codebase in case it's used elsewhere.

