## Root Cause

Logging a loan payment fails with:
> `new row violates row-level security policy for table "loan_payments"`

The `loan_payments` INSERT policy requires `auth.uid() = user_id`, but the `addPayment` mutation in `src/hooks/useLoans.ts` only inserts `{ loan_id, date, amount, principal_portion, interest_portion, late_fee, notes }` — **`user_id` is missing**, so RLS rejects it.

There are two additional latent bugs that would surface immediately after the RLS fix:
1. `loan_payments.payment_type` is `NOT NULL` — not provided by the mutation.
2. `loan_payments.source` is `NOT NULL` — not provided.
3. `loan_payments.project_id` is `NOT NULL` in the schema, but `loans.project_id` is **nullable**. A loan with no project (like the screenshot's "No Project" row) cannot record a payment at all.

## Fix

### 1. `src/hooks/useLoans.ts` — `addPayment` mutation

Update the insert payload to include the columns RLS / NOT NULL constraints require. Look up the loan's `project_id` first so payments can carry it:

```ts
const addPayment = useMutation({
  mutationFn: async (payment: Omit<LoanPayment, 'id' | 'created_at'>) => {
    const { payment_date, ...rest } = payment as any;

    // Look up the loan to inherit project_id (loan_payments shares the table
    // used by project expenses, which has additional NOT NULL columns).
    let projectId: string | null = null;
    if (payment.loan_id) {
      const { data: loanRow } = await loansTable()
        .select('project_id')
        .eq('id', payment.loan_id)
        .single();
      projectId = (loanRow as any)?.project_id ?? null;
    }

    const row = {
      ...rest,
      date: payment_date ?? rest.date,
      user_id: user?.id,        // satisfies RLS
      project_id: projectId,    // inherit from loan
      payment_type: 'loan',     // NOT NULL
      source: 'manual',         // NOT NULL
    };

    const { error } = await paymentsTable().insert(row);
    if (error) throw error;
    // …existing balance-update logic stays the same
  },
  // …onSuccess / onError unchanged
});
```

### 2. Migration — make `loan_payments.project_id` nullable

The `loan_payments` table is shared between project expenses and loan-only payments. A loan can legitimately have no project (the user has at least one such loan in the screenshot data: "Treehouse/Wales" and the earlier "No Project" bar). The column must be nullable to support project-less loans.

```sql
ALTER TABLE public.loan_payments
  ALTER COLUMN project_id DROP NOT NULL;
```

No data needs backfilling; existing rows already have valid project_ids.

### Why not change RLS instead

The RLS policy is correct (`auth.uid() = user_id`). The bug is the client omitting `user_id`. Loosening RLS would be a regression.

## Files Modified

- `src/hooks/useLoans.ts` — fix the `addPayment` insert payload.
- New migration — make `loan_payments.project_id` nullable.

## Out of Scope

- The other `loan_payments` consumer (`src/components/project/LoanPayments.tsx`) already supplies `user_id`, `project_id`, `payment_type`, `source` correctly — no change needed there.
