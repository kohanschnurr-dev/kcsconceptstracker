## Reframe the Loans stats row

The first stat card "Total Outstanding Balance" lumps short-term project debt (hard money, bridge, construction) together with long-term DSCR/rental debt. For day-to-day operations these are very different numbers — a $500K DSCR balance amortizes over 30 years and isn't a "live" cash concern, while $50K of hard money on an active flip is.

### Change

Replace the single balance card with **two focused cards**, turning the stats row into a 4-column grid (stacks 2×2 on tablet, 1 column on mobile).

```text
┌─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┐
│ Active Project Debt │ Long-Term Rental    │ Weighted Avg. Rate  │ Monthly Debt Service│
│ $185,400            │ $515,719            │ 9.42%               │ $4,820              │
│ 2 short-term loans  │ 2 rental loans      │ Across active loans │ All active payments │
└─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘
```

**Card 1 — Active Project Debt** (primary/gold accent)
- Sums balances for `hard_money`, `private_money`, `bridge`, `construction` (the existing `ACCRUES_INTEREST_TYPES` list — already the canonical "short-term" bucket).
- Subtitle: "{n} short-term loan(s)" with tooltip "Hard money, private, bridge, construction"
- Icon: `Hammer` or keep `DollarSign`

**Card 2 — Long-Term Rental Debt** (blue/secondary accent)
- Sums balances for `dscr`, `conventional`, `heloc`, `portfolio`, `seller_financing`, `other`.
- Subtitle: "{n} long-term loan(s)" with tooltip "DSCR, conventional, HELOC, portfolio"
- Icon: `Building2`

Cards 3 and 4 (Weighted Rate, Monthly Debt Service) are unchanged.

### Drill-down dialog

Both new cards open the existing drill dialog, pre-filtered to the relevant bucket. The dialog title reflects the bucket ("Active Project Debt" / "Long-Term Rental Debt") and only lists loans of that type. Existing per-loan rendering (principal + draws breakdown, link to loan detail) is reused.

### Empty states

- If a bucket has 0 loans, the card still renders with `$0` and subtitle "No active {short-term|long-term} loans" — no broken layout, no hidden card.

### Files to change

- `src/components/loans/LoanStatsRow.tsx`
  - Add `SHORT_TERM_TYPES` set (reuse `ACCRUES_INTEREST_TYPES`).
  - Compute `shortTermBalance`, `longTermBalance`, plus loan counts per bucket.
  - Replace the single `balance` stat with `project` + `rental` entries.
  - Update `DrillKey` to `'project' | 'rental' | 'rate' | 'debt'` and filter `active` loans by bucket inside the dialog.
  - Change grid from `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4`.

No data model, query, or backend changes required.