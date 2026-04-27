## Fix

Only short-term / interest-only loans should contribute to the "Interest Accrued" segment in the Capital Stack chart. Amortizing loans (DSCR, conventional, HELOC, portfolio, seller financing) pay interest as part of their monthly payment, so there's nothing to accrue.

### `src/components/loans/LoanCharts.tsx`

Inside the `byProject` `useMemo`, gate the interest accrual by loan type:

```ts
const ACCRUES_INTEREST: LoanType[] = ['hard_money', 'private_money', 'bridge', 'construction'];
if (l.start_date && ACCRUES_INTEREST.includes(l.loan_type)) {
  const start = new Date(l.start_date).getTime();
  const days = Math.max(0, (today - start) / (1000 * 60 * 60 * 24));
  const accrued = bal * (l.interest_rate / 100) * (days / 365);
  if (accrued > 0) map[key].__interest += accrued;
}
```

The yellow "Interest Accrued" segment will simply not appear on bars where every loan is amortizing (e.g., the Wales Rental DSCR bar). Its color/legend entry remains so the existing hard-money / private-money / bridge / construction loans still show their accrual cap.

## Files Modified

- `src/components/loans/LoanCharts.tsx`
