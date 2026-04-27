## Interest Schedule tab for non-amortizing loans

Replace the "Amortization" tab with an event-based **Interest Schedule** for hard-money / bridge / construction / private-money loans (anything not DSCR or conventional). DSCR/conventional keep the existing amortization table.

### What the user sees

A chronological ledger where every row is a real (or projected) event that changes the balance:

| # | Date | Event | Draw / Funded | Principal Paid | Interest Accrued | Interest Paid | Running Balance |
|---|------|-------|---------------|----------------|------------------|---------------|-----------------|

Row types, in order:
1. **Loan Start** — initial disbursement (`original_amount`).
2. **Draw funded** — adds to balance; subtitle shows draw # + milestone name.
3. **Payment** — splits into principal/interest portions; reduces balance accordingly.
4. **Today (live)** — gold-highlighted row showing accrued-but-unpaid interest as of now.
5. **Pending draw** *(future, dashed)* — projected disbursement on `expected_date`.
6. **Maturity** *(future, dashed)* — final balloon row showing payoff balance + remaining interest.

Visual treatment:
- Past events: green check icon, normal weight
- Today row: gold left border, bold "Today" badge
- Future/projected: muted text, dashed left border, "Projected" badge
- Each event row colored by type icon: Draw (blue ArrowUpCircle), Payment (green ArrowDownCircle), Today (gold Clock), Maturity (red Flag)

Header summary cards (3 across):
- **Currently Holding** — outstanding principal right now
- **Interest Accrued (unpaid)** — live number through today
- **Total Disbursed** — original + funded draws

Plus an "Export CSV" button matching the existing pattern.

### Calculation logic (`buildInterestSchedule` in `src/types/loans.ts`)

```ts
type LedgerEvent = {
  date: string;
  kind: 'start' | 'draw' | 'payment' | 'today' | 'pending_draw' | 'maturity';
  label: string;
  drawAmount?: number;
  principalPaid?: number;
  interestPaid?: number;
  interestAccrued: number;   // simple interest since prior event on prior balance
  balance: number;            // principal balance after this event
  unpaidInterest: number;     // running total of interest accrued − interest paid
  isFuture: boolean;
};
```

Algorithm:
1. Merge `[loan start, ...funded draws sorted by date_funded, ...payments sorted by date]` into a single past-events timeline.
2. Walk forward: at each event compute `interestAccrued = priorBalance * (rate/365 or 360) * daysSincePrior`, then mutate balance (add draw amount, subtract `principal_portion` from payment).
3. Append synthetic `today` row using the same accrual rule from last event → today.
4. Append pending draws (`status !== 'funded'`) and a final `maturity` row (with effective maturity after extensions). Future rows continue the accrual math but are flagged `isFuture: true`.

Use `interest_calc_method` to choose `360` vs `365` day basis (matching `buildDrawInterestSchedule`). Use `parseDateString` per the project's date-parsing rule to avoid UTC drift.

### Files to change

- **`src/types/loans.ts`** — add `LedgerEvent` type + `buildInterestSchedule(loan, draws, payments, extensions)` helper.
- **`src/components/loans/InterestScheduleTable.tsx`** *(new)* — renders the ledger, summary cards, CSV export. Uses semantic tokens (`bg-card`, `text-muted-foreground`, gold = `text-primary`, sharp 2px corners, 1px borders) per the project's aesthetic standards.
- **`src/pages/LoanDetail.tsx`** — switch tab label/content based on `loan.loan_type`:
  - `dscr` / `conventional` → existing `<AmortizationTable>` under "Amortization" tab
  - everything else → new `<InterestScheduleTable>` under "Interest Schedule" tab
- **`src/components/loans/AmortizationTable.tsx`** — left untouched (still used by DSCR/conventional).

### Edge cases handled

- Loan with no draws and no payments → 3 rows: Start, Today, Maturity.
- Multiple payments on the same day → ordered by `created_at`, each gets its own row.
- Draw funded after a payment → balance correctly steps back up.
- Late fees on payments → shown as a small badge on the payment row, not added to principal.
- Variable-rate loans → use current `interest_rate` (rate-history is out of scope).
- Extensions → maturity row uses the latest `extended_to` date.