

## Fix Duplicate QuickBooks Expenses on Expenses Page

### Problem
The Expenses page fetches records from two tables and combines them:
1. The `expenses` table (where imported QB expenses are inserted during categorization)
2. The `quickbooks_expenses` table (where `is_imported = true` records are also fetched)

This causes every imported QB expense to appear twice -- once from each table. The "Transfer" payment method you see is actually the correct record from the `expenses` table (QB stores Zelle as "transfer"), while the other is the raw `quickbooks_expenses` record.

### Solution

In `src/pages/Expenses.tsx`, after fetching both datasets, filter out any `quickbooks_expenses` records whose `id` matches a `qb_expense_id` value in the `expenses` table. This prevents the duplicate while preserving older QB records that don't yet have a link.

### Technical Details

**File: `src/pages/Expenses.tsx`**

In the `fetchData` function, after fetching both `expensesData` and `qbExpensesData`, collect all `qb_expense_id` values from the expenses table and exclude matching QB records:

```typescript
// Collect linked QB IDs from expenses table
const linkedQbIds = new Set(
  (expensesData || [])
    .map(e => e.qb_expense_id)
    .filter(Boolean)
);

// Filter out QB expenses that already have a linked expenses record
const filteredQbExpenses = (qbExpensesData || [])
  .filter(qb => !linkedQbIds.has(qb.id));
```

This is a single change in one file -- no other modifications needed.

