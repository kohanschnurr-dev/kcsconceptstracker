

## Fix Loan Import: Add 'loan' to expense_type Check Constraint

### Problem
The error "Failed to create expense record" is caused by a **CHECK constraint** on the `expenses.expense_type` column. It currently only allows `'product'` and `'labor'`, but the loan import flow tries to insert with `expense_type: 'loan'`.

The `category_id` nullable fix was correct and applied -- this is a separate, second constraint that also needs updating.

### Solution

**Database migration** -- update the check constraint to include `'loan'` and `'monthly'` (since monthly is also used in the QB flow):

```sql
ALTER TABLE public.expenses DROP CONSTRAINT expenses_expense_type_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_expense_type_check
  CHECK (expense_type = ANY (ARRAY['product', 'labor', 'loan', 'monthly']));
```

That's it. One migration, no code changes needed. The insert logic in `useQuickBooks.ts` is already correct -- it just needs the database to accept `'loan'` as a valid type.
