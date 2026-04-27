# Unify loan balance across all surfaces

## Bug recap
Two helpers measure "outstanding balance" differently:
- `loanBalanceWithDraws` (table, top stats) = `outstanding_balance + funded_draws` — never subtracts payments unless your payment flow updates `outstanding_balance`.
- `effectiveOutstandingBalance` (donut, capital stack) = `original_amount − principal_paid` — never adds funded draws when payments exist; falls back to `outstanding_balance` (no draws) when payments don't exist.

Result: Private Money totals disagree by $55,000+ depending on which loans have draws vs payments.

## Single source of truth

Update `effectiveOutstandingBalance` in `src/types/loans.ts` to be the one true formula:

```ts
fundedDraws = loan.has_draws ? (loan.funded_draws_total ?? 0) : 0
if (no payments)
   return (outstanding_balance ?? original_amount) + fundedDraws
else
   principalPaid = sum(p.principal_portion ?? max(0, amount - interest - lateFee))
   return max(0, original_amount + fundedDraws - principalPaid)
```

The widened `Pick<>` type adds `has_draws` and `funded_draws_total` so callers don't need to change shape.

## Wire all four surfaces to it

1. **`src/components/loans/LoanStatsRow.tsx`** — replace `loanBalanceWithDraws(l)` with `effectiveOutstandingBalance(l, paymentsByLoan[l.id] ?? [])`. The component currently doesn't fetch payments, so add a `useQuery` that fetches `loan_payments` for active loans (same shape as `LoanCharts.tsx`). Re-export a thin `loanBalanceWithDraws(l, payments=[])` shim that just calls `effectiveOutstandingBalance` so existing imports keep compiling.

2. **`src/components/loans/LoanTable.tsx`** — accept an optional `paymentsByLoan` prop (or fetch internally) and call `effectiveOutstandingBalance(loan, paymentsByLoan[loan.id] ?? [])` for the Balance column. Where the table is rendered (`src/pages/Loans.tsx`), thread the same payments query through.

3. **`src/components/loans/LoanCharts.tsx`** — already calls `effectiveOutstandingBalance` when payments exist; remove the `lp.length ? … : loanBalanceWithDraws(l)` fallback in both the donut (`pieRows`) and the capital stack (`byProject`) and just call `effectiveOutstandingBalance(l, lp)` unconditionally. The new helper handles the no-payments case correctly.

4. **`src/pages/Loans.tsx`** — lift the `loan_payments` fetch to the page so `LoanStatsRow`, `LoanTable`, and `LoanCharts` all share one query (avoid three duplicate network calls). Pass `paymentsByLoan` down via props.

## Expected Private Money totals after fix
- Treehouse/Wales: 245,000 − 58,000 = **$187,000**
- Construction Costs: 50,000 + 60,000 = **$110,000**
- Purchase & Construction: 375,319 + 55,000 − 66,761 = **$363,558**
- Land Costs: 58,000 = **$58,000**
- **Total = $718,558** ✓ (matches your manual sum, and the table, donut, capital stack, and top stat card will all agree)

## Verification
Run `bunx tsc --noEmit` after edits, then visually confirm in `/loans` that the Private Money slice tooltip and the table column footer both read $718,558.
