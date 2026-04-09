

## Fix: Add 'parsing' to pending_receipts status check constraint

### Problem
The `pending_receipts` table has a CHECK constraint (`pending_receipts_status_check`) that restricts the `status` column to specific values. When background parsing tries to insert a row with `status = 'parsing'`, it violates this constraint.

### Solution
**Database migration**: Drop the existing check constraint and recreate it with `'parsing'` and `'failed'` added to the allowed values.

```sql
ALTER TABLE public.pending_receipts DROP CONSTRAINT pending_receipts_status_check;
ALTER TABLE public.pending_receipts ADD CONSTRAINT pending_receipts_status_check 
  CHECK (status IN ('pending', 'matched', 'approved', 'rejected', 'parsing', 'failed'));
```

### Files
- One database migration only — no code changes needed.

