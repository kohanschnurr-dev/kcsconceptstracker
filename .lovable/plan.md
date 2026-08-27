# Monthly Holding Costs in the Budget Calculator

Today holding costs are either a flat dollar amount or a one-time percentage of purchase price. This adds a third, more realistic option: a monthly carry rate multiplied by the number of months held.

## What changes

Holding Costs in the Deal sidebar gets a third mode alongside `%` and `$`:

- **Monthly** — enter a rate plus **Months Held**, and the calculator multiplies them.
- Within monthly mode, the rate itself can be toggled between **$/mo** (e.g. $1,800/mo) and **%/mo** of purchase price (e.g. 0.5%/mo).
- Months held accepts decimals (e.g. 6.5) so partial months are supported.

Example: $1,800/mo x 6 months = $10,800 holding costs.

## UI

In the sidebar's editable Costs block:

```text
Holding Costs   [ % | $ | /mo ]
[ 1800 ]  ($/mo | %/mo)
Months held  [ 6 ]
--------------------------------
$1,800/mo x 6 mo = $10,800
```

- A small live "math line" under the inputs shows rate x months = total, so the number is never a mystery.
- The read-only summary row changes its label to `Holding (6 mo @ $1,800/mo)` instead of `Holding (3%)`.
- Existing `%` and `$` modes are untouched, so current saved deals behave exactly as before.

## Where it flows through

- Total Investment, Net Profit, ROI, and MAO all consume the same computed holding number — no formula changes needed beyond the new mode.
- The PDF deal-sheet export picks up the new label so wholesalers see `Holding Costs (6 mo @ $1,800/mo)`.
- The values are saved with the rest of the calculator's deal metadata, so reloading a saved deal restores months held and rate mode.

## Technical notes

- `src/pages/BudgetCalculator.tsx`: extend the holding mode union to `'pct' | 'flat' | 'monthly'`; add `holdingMonthlyRate`, `holdingMonthlyRateMode` (`'dollar' | 'pct'`), and `holdingMonths` state; include them in the load/save metadata blocks and the template/preset reset paths (defaults keep `pct` behaviour).
- Compute: `monthly = rateMode === 'pct' ? purchasePrice * rate/100 : rate;` `holdingCosts = monthly * months`.
- `src/components/budget/DealSidebar.tsx`: widen `ModeToggle` for holding to three options, add the months/rate inputs and the math line, and extend `costLabel` to render the monthly label. Sidebar mirrors the same computation it already does locally.
- `src/lib/budgetPdfExport.ts`: no signature change — the existing `holdingLabel` string carries the new text.
- Backwards compatible: saved deals without the new fields fall back to `pct`.
