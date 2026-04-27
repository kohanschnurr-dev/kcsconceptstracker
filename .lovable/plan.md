## Goal

Replace the **Rate** column in the loans table with **Interest Accrued**, showing each loan's unpaid interest accrued through today.

## Changes

**`src/components/loans/LoanTable.tsx`**

1. Add a `useQuery` to fetch all `loan_payments` for the loans currently shown (keyed on sorted loan IDs), mirroring the pattern already used in `LoanCharts.tsx`.
2. Build a `paymentsByLoan` lookup map.
3. Compute accrued interest per loan with the existing `accruedInterestThroughToday(loan, payments)` helper from `@/types/loans`. For loan types not in `ACCRUES_INTEREST_TYPES` (e.g. amortizing loans), display `—` since they don't accrue unpaid interest.
4. Replace the header `<TableHead className="text-right">Rate <SortBtn col="interest_rate" /></TableHead>` with `<TableHead className="text-right">Interest Accrued</TableHead>` (no sort — value is computed, not a column).
5. Replace the cell `{loan.interest_rate.toFixed(2)}%` with the formatted accrued amount.

## Technical detail

```tsx
const { data: payments = [] } = useQuery<LoanPayment[]>({
  queryKey: ['loan_payments_for_table', loans.map(l => l.id).sort()],
  enabled: loans.length > 0,
  queryFn: async () => {
    const { data, error } = await (supabase.from('loan_payments' as any) as any)
      .select('loan_id, payment_date, amount, principal_portion, interest_portion, late_fee')
      .in('loan_id', loans.map(l => l.id));
    if (error) throw error;
    return (data ?? []) as LoanPayment[];
  },
});

const paymentsByLoan = useMemo(() => { /* group by loan_id */ }, [payments]);

// In the row:
<TableCell className="text-right">
  {ACCRUES_INTEREST_TYPES.includes(loan.loan_type)
    ? fmt(accruedInterestThroughToday(loan, paymentsByLoan[loan.id] ?? []))
    : '—'}
</TableCell>
```

No other columns or behavior change.