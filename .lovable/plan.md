# Loan Payoff Scenario Simulator

Add a non-destructive "what if I hold this loan until…" view to the Interest Schedule tab. It projects the payoff position at any future date without touching the saved loan, and offers an explicit action to make that date real.

## What the user sees

A scenario bar sits above the ledger on the Interest Schedule tab:

```text
[ Scenario  ○ off ]  Hold until [ Aug 26, 2027 ]  Draws: [Funded only ▾]  Ext. fee [ 1 % | $ ]   [ Apply this date… ]
```

When the scenario is on:
- The three summary tiles switch to scenario values and pick up a "Scenario" badge: Payoff Amount (principal + unpaid interest + fee), Interest at Payoff, and Days Held.
- A fourth strip line shows the delta vs. today: extra interest accrued between today and the chosen date, plus effective annualized cost.
- The ledger gains a projected "Scenario Payoff" row on the chosen date (dashed, gold, badge "Scenario"), and — if the date is past maturity — the maturity row stays visible so the extension window is obvious.
- If "Assume pending draws funded" is chosen, pending draws inside the window are included in the projection and their rows lose the muted styling.
- Turning the scenario off restores the exact current view. Nothing is written to the database at any point.

## Apply this date

Clicking **Apply this date…** opens a confirm dialog with two choices:
1. **Update maturity date** — sets the loan's maturity date to the scenario date.
2. **Record an extension** — creates an extension entry from the current maturity to the scenario date, carrying over the fee entered in the scenario bar (editable in the dialog).

The dialog shows a plain-language summary of the resulting payoff figure. Cancel leaves everything untouched.

## Technical notes

- `buildInterestSchedule` in `src/types/loans.ts` already accepts `asOf` and builds a chronological ledger. Extend its args with an optional `scenario: { payoffDate, includePendingDraws, extensionFeeAmount }`:
  - when set, inject a `scenario_payoff` ledger kind at `payoffDate`, accrue interest through it, include pending draws only when requested, and return `scenarioPayoff` totals (principal, unpaid interest, fee, total, daysHeld, effectiveAnnualRate).
  - existing callers pass nothing and behave identically — the function stays pure, no writes.
- `src/components/loans/InterestScheduleTable.tsx`: local scenario state (date, draw assumption, fee mode/value), the scenario bar, scenario-aware summary tiles, new `KIND_META` entry for `scenario_payoff`, legend entry, and scenario columns/flag added to the CSV export.
- New `src/components/loans/ApplyScenarioDateDialog.tsx`: radio choice between maturity update and extension, fee input, confirm/cancel. Uses existing loan mutation hooks in `src/hooks/useLoans.ts` and the same insert shape as `src/components/loans/LoanExtensions.tsx`.
- Date input uses the shadcn Datepicker pattern with `pointer-events-auto`; validation blocks dates on or before today.
- Styling follows existing loan detail standards: sharp corners, 1px borders, gold primary for the scenario accents, no emojis.
