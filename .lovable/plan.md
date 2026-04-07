

## Fix "Could not find 'project_name' column" Error on Loan Edit

### Problem
When saving edits to a loan, the `updateLoan` mutation sends `project_name` (a virtual/joined field) to the database. The `loans` table doesn't have a `project_name` column, causing the error.

### Change

**File: `src/hooks/useLoans.ts`** (~line 169)

Strip non-database fields (`project_name`, `created_at`, `updated_at`) from the update payload before sending:

```typescript
const updateLoan = useMutation({
  mutationFn: async ({ id, ...payload }: Partial<Loan> & { id: string }) => {
    const { project_name, created_at, updated_at, ...dbPayload } = payload as any;
    const { data, error } = await loansTable().update(dbPayload).eq('id', id).select().single();
    if (error) throw error;
    return data as unknown as Loan;
  },
  // ...rest unchanged
});
```

One line added to destructure out virtual fields. No other files affected.

