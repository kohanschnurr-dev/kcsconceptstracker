## Why the three numbers disagree

There are **three different math engines** computing "interest accrued" for the same loan:

| Surface | Function | Issue |
|---|---|---|
| Loan table column | `totalAccruedInterest` → `accruedInterestThroughToday` + `buildDrawInterestSchedule` | Hard-codes 365-day basis (ignores `interest_calc_method`). For `has_draws` loans it adds the **entire projected interest from each draw to maturity** on top of original-principal accrual → overcounts. |
| Loan detail summary tile | Same `totalAccruedInterest` | Same overcount; also drifts from the table only because the two `useQuery` instances aren't synced. |
| Interest Schedule tab | `buildInterestSchedule` | A proper chronological ledger — applies the correct day basis, walks each draw/payment in real order, evaluates at today. **This is the rigorous calculation.** |

The ledger is the only one that handles the math correctly. Everything else should read from it.

## Fix — single source of truth

### 1. Add `currentAccruedInterest(loan, payments, draws, extensions?)` in `src/types/loans.ts`

Thin wrapper that runs `buildInterestSchedule` and returns `result.currentUnpaidInterest`. Same inputs `totalAccruedInterest` accepts so the swap is mechanical.

### 2. Replace `totalAccruedInterest` call sites with `currentAccruedInterest`

- `src/components/loans/LoanTable.tsx` — already fetches payments + draws; swap the cell to call `currentAccruedInterest`. Number now exactly matches the ledger.
- `src/pages/LoanDetail.tsx` — replace the `combinedInterest` line. The summary tile, the cost-of-capital math (`totalCost = combinedInterest + ...`), and the "Balance" tile (`effectiveBalance + combinedInterest`) all consume one value from the ledger.
- `src/components/loans/LoanCharts.tsx` — swap the per-loan accrued amount used in the capital-stack bar.

### 3. Remove the now-stale helpers

Mark `totalAccruedInterest` and the public surface of `accruedInterestThroughToday` as **deprecated** but keep the exports temporarily so any third call site (CSV export, comparison mode) doesn't break — I'll grep for stragglers and migrate or leave them with a `@deprecated` JSDoc warning. `buildDrawInterestSchedule` stays only for the breakdown UI on the detail page that displays per-draw fees, but its `totalInterest` will no longer be summed into the headline figure.

### 4. Verify all three surfaces show the **same** value

After the swap: table column == top tile == "Interest Accrued (Unpaid)" on the Interest Schedule tab, all reading `result.currentUnpaidInterest`.

## Files touched

- `src/types/loans.ts` — add `currentAccruedInterest`, deprecate the old helpers
- `src/components/loans/LoanTable.tsx` — swap helper
- `src/pages/LoanDetail.tsx` — swap helper for `combinedInterest`
- `src/components/loans/LoanCharts.tsx` — swap helper

## Result

One number, one source: the chronological ledger. The table, the detail tile, and the Interest Schedule tab all show the same dollar value to the cent.
