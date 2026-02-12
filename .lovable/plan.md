

## Fix: Prevent Duplicate Expenses and Remove "Transfer" Payment Method

### Problem 1: Duplicate Expenses
When a QuickBooks expense is imported, the system inserts into the `expenses` table without checking if a record with the same `qb_expense_id` already exists. If the import runs twice (e.g., user clicks again, or a race condition), identical expense rows are created.

### Problem 2: "Transfer" Payment Method
Line 530 in `useQuickBooks.ts` hardcodes `payment_method: 'transfer' as const` for every imported expense, regardless of the actual payment method from QuickBooks. The user only expects "cash" or "card" as valid options.

### Solution

**File: `src/hooks/useQuickBooks.ts`** (3 import paths to fix)

#### A. Add duplicate check before every expense insert
Before each `.from('expenses').insert(...)` call, query for an existing record with the same `qb_expense_id`. Skip the insert if one already exists. There are 3 insert locations:

1. **Line ~523 (single import, live mode)** -- add duplicate check before insert
2. **Line ~645 (manual split import)** -- add duplicate check before insert  
3. **Line ~770 (SmartSplit batch import)** -- add duplicate check before insert

```ts
// Before each insert, check for existing
const { data: existingExpense } = await supabase
  .from('expenses')
  .select('id')
  .eq('qb_expense_id', expenseId)
  .maybeSingle();

if (existingExpense) {
  // Already imported, skip insert
} else {
  // Proceed with insert
}
```

#### B. Fix payment method mapping
Replace all hardcoded `'transfer'` values and normalize the payment method from QuickBooks data to only allow "cash" or "card":

```ts
// Helper to normalize payment method (only cash or card allowed)
const normalizePaymentMethod = (method: string | null): 'cash' | 'card' => {
  if (method === 'cash') return 'cash';
  return 'card'; // default everything else (transfer, check, etc.) to card
};
```

Apply this in all 4 insert locations:
- Line 488 (demo mode): already uses `expense.payment_method` but with full type union -- normalize it
- Line 530 (live mode): currently hardcoded to `'transfer'` -- use `normalizePaymentMethod(expense.payment_method)`
- Line 654 (manual split): uses `expense.payment_method` with full union -- normalize it
- Line 779 (SmartSplit batch): uses `expense.payment_method` with full union -- normalize it

#### C. Also fix demo mode duplicate check (Line ~479)
The demo mode insert (line 479) also lacks a duplicate guard.

### Files Modified
- `src/hooks/useQuickBooks.ts` -- add duplicate checks before all expense inserts, normalize payment method to cash/card only

### No Database Changes Needed
The `qb_expense_id` column already exists in the `expenses` table. We are adding application-level dedup checks. The `payment_method` enum in the database includes "transfer" but we will simply stop using it for new records.

