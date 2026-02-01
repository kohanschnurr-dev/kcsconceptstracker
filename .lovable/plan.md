

## ✅ COMPLETED: Group Split Expenses in QuickBooks Pending Queue

### Implementation Summary

Split expenses from SmartSplit are now grouped together in the QuickBooks Integration pending queue instead of appearing as individual cards.

### Changes Made

1. **New Component: `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**
   - Handles both single expenses and grouped split expenses
   - Expandable UI showing child splits with their categories
   - "Import All" button for pre-categorized splits from SmartSplit

2. **Updated: `src/components/QuickBooksIntegration.tsx`**
   - Added grouping logic using `useMemo` to group expenses by parent transaction ID
   - Uses the new `GroupedPendingExpenseCard` component for rendering
   - Cleaned up unused helper functions

3. **Updated: `src/hooks/useQuickBooks.ts`**
   - Added `importAllSplits` function to import all split expenses at once
   - Extracts categories from `qb_id` suffix (e.g., `purchase_769_split_hardware`)

### How It Works

| Scenario | Behavior |
|----------|----------|
| Single expense | Standard card with project/category selection |
| Split group | Collapsed card showing total; expand to see categories |
| Pre-categorized splits | "Import All" button to mark all as imported at once |

### Fixed Issues

- Amazon splits now appear as one grouped row showing $671.60 total
- User can expand to see individual category breakdowns
- One-click import for SmartSplit-processed receipts
