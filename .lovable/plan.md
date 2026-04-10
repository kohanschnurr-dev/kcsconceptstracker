

## Add Delete/Send Back to Queue for Business Expenses + Receipt Match Prompt on Import

### Problem
1. Business expenses imported from QB cannot be deleted or sent back to the queue from the detail modal
2. When importing a QB expense that already has a matching pending receipt, the receipt isn't auto-attached — leading to duplicates

### Changes

**1. `src/components/BusinessExpenseDetailModal.tsx` — Add Delete + Send Back to Queue buttons**
- Add `onDelete` callback prop to the component
- Add a Delete button (with confirmation dialog) that deletes the expense from `business_expenses`
- Add a "Send Back to Queue" button that:
  - Deletes the business expense record
  - Resets the matching `quickbooks_expenses` record to `is_imported: false` (needs to match by vendor_name + amount + date since business_expenses doesn't track `qb_expense_id`)
- Add the necessary state variables (`isDeleting`, `isResetting`, `showDeleteConfirm`)

**2. `src/pages/BusinessExpenses.tsx` — Pass delete handler to detail modal**
- Add `onDelete` handler that deletes from `business_expenses` and refreshes the list
- Pass it to `BusinessExpenseDetailModal`

**3. `src/components/BusinessQuickBooksIntegration.tsx` — Auto-attach matching receipts on import**
- Before inserting into `business_expenses`, query `pending_receipts` for a match (same vendor name similarity + amount within tolerance + date within 3 days)
- If a match is found, auto-attach the receipt URL to the imported business expense and update the pending receipt status to `'matched'`
- Show a toast confirming the receipt was auto-attached

**4. `src/components/QuickBooksIntegration.tsx` — Same receipt matching for regular expenses**
- Apply the same matching logic in the regular QB import flow
- When importing to `expenses`, check `pending_receipts` for matches and auto-attach

### Technical Details
- Match criteria: vendor name contains match (case-insensitive), amount within $0.50, date within 3 days
- The `business_expenses` table doesn't have a `qb_expense_id` column, so "Send Back to Queue" will match the QB record by vendor + amount + date
- No database migrations needed — all changes are client-side logic

