# Hide Interest Accrued for DSCR Loans

## Goal
On the Loans page table, the "Interest Accrued" column should display "—" (nothing) for DSCR loans, since DSCR loans are 30-year amortizing loans where interest is paid monthly through scheduled amortization — making an "accrued interest" figure misleading.

All other loan types (Hard Money, Private Money, Bridge, etc.) keep their current accrued interest calculation.

## Change

**File:** `src/components/loans/LoanTable.tsx`

In the table body row, update the Interest Accrued cell:

```tsx
<TableCell className="text-right">
  {loan.loan_type === 'dscr'
    ? '—'
    : fmt(currentAccruedInterest(loan, paymentsByLoan[loan.id] ?? [], drawsByLoan[loan.id] ?? []))}
</TableCell>
```

That's the only edit required. The column header stays the same so the table layout is unchanged; DSCR rows simply render an em-dash like other null values in the table.

## Why no broader change
- The donut chart (`LoanCharts.tsx`) already excludes DSCR/amortizing loans from accrued-interest aggregation in prior work, so this is purely a table-display fix.
- Conventional/HELOC amortizing loans are rare in this app; if the user later wants those hidden too, we can extend the check to `['dscr','conventional','heloc'].includes(loan.loan_type)`. For now, scoping strictly to DSCR per the request.
