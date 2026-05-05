## Add payment $ amount to Next Payment column

The Next Payment column currently shows only the date. Add the dollar amount underneath so the user can see both at a glance.

### Change

In `src/components/loans/LoanTable.tsx` row renderer (line 339), render the date on the first line and `loan.monthly_payment` formatted as currency on a smaller secondary line:

```tsx
<TableCell className="text-sm text-center">
  <div>{formatDisplayDate(next)}</div>
  {loan.monthly_payment != null && loan.monthly_payment > 0 && (
    <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
      {fmt(loan.monthly_payment)}
    </div>
  )}
</TableCell>
```

The Maturity column stays where it is (immediately after Next Payment), matching the user's "before maturity, after next payment" placement. No header change needed — the column is still "Next Payment", but each cell now shows date + amount.

### Files

- `src/components/loans/LoanTable.tsx` — single cell update.