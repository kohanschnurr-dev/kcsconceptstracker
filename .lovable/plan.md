

## Add Accrued Interest Column for Simple Interest Loans

When a loan uses the `simple` interest calculation method (interest-only payments), users currently see per-period interest but have no running total. This change adds a cumulative "Accrued Interest" column so they can see total interest owed at each payment date.

### Changes

**`src/types/loans.ts`**
- Add `accrued_interest` field to the `AmortizationRow` interface (optional, only populated for simple interest loans).

**`src/components/loans/AmortizationTable.tsx`**
- Detect whether the loan is simple interest (`loan.interest_calc_method === 'simple'` or `loan.payment_frequency === 'interest_only'`).
- Compute a running cumulative interest total across the schedule rows.
- When simple interest: add a new "Accrued Interest" column header between "Interest" and "Balance", and render the cumulative value in each row styled in a distinct color (e.g., `text-warning` amber) so it stands out from per-period interest.
- Update the summary cards: add a 4th summary card "Cumulative Interest at Payoff" (only shown for simple interest loans) — or simply rely on the existing "Total Interest" card which already shows this.
- Update CSV export to include the accrued interest column when applicable.

**No other files change.** The `buildAmortizationSchedule` function already returns per-period interest; the cumulative sum is a presentation-layer concern computed in the component.

### UI Details
- Column only appears for simple interest loans (no clutter for amortizing loans).
- Running total formatted as currency, styled `text-warning` to differentiate from per-period interest.
- Table header gets `Accrued Interest` label with `text-right` alignment matching other numeric columns.
- CSV export includes the column when present.

