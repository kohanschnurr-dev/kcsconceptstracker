# Filter Loans by Loan Purpose

Add a second filter row on the Loans page so users can narrow the entire page (stats row, table, and charts) by loan purpose (e.g. Working Capital, DSCR / Long-Term Hold, Purchase & Construction) — in addition to the existing project-type filter.

## UX

Under the existing "All Projects / Fix & Flips / Rentals / New Construction" pill row, add a second pill row: **Loan Purpose**.

- First pill: `All Purposes` (default).
- Additional pills: only the purposes actually present in the current loan set (dynamic, sorted). Each pill uses its stable purpose color (from `LOAN_PURPOSE_COLORS`) as a small color dot so it visually matches the table pill and chart legend.
- Both filters compose (AND): e.g. "Rentals" + "DSCR / Long-Term Hold".
- Filter row hides when there are no loans, matching the existing project-type row.

The filter drives `visibleLoans`, which already feeds `LoanStatsRow`, `LoanTable`, and `LoanCharts` — so the pie/bar charts and totals update automatically.

## Technical Notes

- Loan purpose is stored in `loans.nickname` (string). No schema changes needed.
- File touched: `src/pages/Loans.tsx` only.
  - Add `purposeFilter` state (`string | 'all'`, default `'all'`).
  - Derive `availablePurposes` from `loans.map(l => l.nickname)` (unique, non-null, sorted).
  - Extend `visibleLoans` memo to also filter by `l.nickname === purposeFilter` when not `'all'`.
  - Render the new pill row below the existing project-type pills, reusing the same pill styling; add a colored dot per pill via `getLoanPurposeColor(purpose).hsl`.
- No changes to `LoanCharts`, `LoanTable`, `LoanStatsRow` — they already accept a filtered `loans` array.
