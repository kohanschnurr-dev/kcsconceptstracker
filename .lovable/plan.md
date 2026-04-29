## Goal

Replace the single condensed Balance column on `/loans` (table view) with **four explicit money columns** so the math is visible at a glance:

```text
Original  →  Draws / Payoffs  →  Interest Accrued  →  Balance (payoff)
```

Drop **Monthly Pmt** from the table view to make room (it stays in the card view and the loan detail page).

Per your earlier answers:
- **Draws / Payoffs** shows net activity for ALL loans (drawn − paid down).
- **Balance** = total payoff today (principal + accrued interest).

## Final desktop column order (table view)

```text
Project | Loan Purpose | Original | Draws/Payoffs | Interest | Balance | Next Payment | Maturity | Status
```

## Column behavior

1. **Original** — `loan.original_amount`. Right-aligned currency.

2. **Draws / Payoffs** — single signed value, right-aligned, color-coded:
   - `+ funded_draws` (when `has_draws`, from `funded_draws_total`)
   - `− principal portion of payments` (sum of `principal_portion`, falling back to `amount − interest_portion − late_fee`)
   - Net positive → warning/gold tone with `+` prefix
   - Net negative → success/green tone with `−` prefix
   - Exactly zero → muted `—`
   - Hover tooltip: "Drawn $X · Paid down $Y" so the components are inspectable without expanding.

3. **Interest Accrued** — `currentAccruedInterest(loan, payments, draws)` for non-DSCR; `—` for DSCR (matches existing convention). Warning color when > 0.

4. **Balance** — payoff amount = `effectiveOutstandingBalance + accruedInterest` (DSCR shows just principal since interest is `—`). Bold, primary text color. The math reconciles: `Original + Draws/Payoffs + Interest = Balance`.

## Other surfaces

- **Card view** — keep current layout, but add a small "Net activity" line under Balance using the same signed value/color. Border color already updated last turn to match loan-type pill.
- **Group subtotal row** — extend to subtotal Original, Net Activity, Interest, and Balance (currently only shows Balance and Monthly).
- **Grand totals row** — same: totals for Original, Net Activity, Interest, Balance. Drop the Monthly total cell.
- **Sorting** — add sort keys `original_amount`, `net_activity`, `interest_accrued`. `balance_calc` keeps sorting by payoff balance (now interest-inclusive).
- **Expand chevron** — removed; the breakdown now lives in dedicated columns. `expandedBalances` state, `toggleBalanceExpand`, `ChevronUp`/`ChevronDown` imports go away.
- **`colCount`** — recalculated for the new column count (9 base + 1 for compare checkbox = 10).

## Visual polish

- Right-align all four money columns; headers stay center-aligned with sort icons inline.
- `tabular-nums` on money cells so digits line up across rows.
- Subtle vertical divider before the Balance column to visually separate "components" from "result".
- Tooltip uses the existing `@/components/ui/tooltip` primitive — no new dependency.

## Files to edit

- `src/components/loans/LoanTable.tsx`
  - Imports: drop `ChevronDown`/`ChevronUp`, add `Tooltip*`.
  - `EnrichedLoan` type: add `drawn`, `paidDown`, `netActivity`, `payoff` fields.
  - `enrichedFiltered`: compute the new fields per loan.
  - `totals`: add `original`, `netActivity`, `interest`, `payoff`. Remove `monthly` from totals row.
  - `renderLoanRow`: rewrite to render the 4 new cells in place of the single Balance cell, drop Monthly Pmt cell.
  - Group subtotal row: include all 4 new column subtotals.
  - Grand totals row: same.
  - Header row: 4 new headers, drop Monthly Pmt header, add new sort keys.
  - Card view: add "Net activity" line under the Balance number.

No DB or type changes — `funded_draws_total`, `principal_portion`, and `currentAccruedInterest` already exist and are already being passed in.
