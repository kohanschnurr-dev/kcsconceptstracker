

## Add Draw-Aware Outstanding Balance & Interest Calculations

### Problem
Currently, the amortization schedule and outstanding balance ignore draw timing and per-draw interest rates. Draws should build up the outstanding balance as they're funded, and interest should be calculated per-draw at each draw's own rate.

### Changes

**1. `src/types/loans.ts` — New `buildDrawAmortizationSchedule` function**
- Create a month-by-month amortization schedule for draw-based loans
- Each month: identify which draws are funded by that date, sum their amounts for the running balance
- Calculate interest on each draw's portion at its respective rate (or loan default)
- Track draw fees in the month they occur
- Return `AmortizationRow[]` with the same shape so the existing table renders it

**2. `src/pages/LoanDetail.tsx` — Outstanding Balance from draws**
- For draw-based loans, compute outstanding balance as cumulative funded draw amounts (instead of `loan.outstanding_balance`)
- Update the "Outstanding Balance" stat card to reflect this
- Interest Accrued stat already uses `drawInterest` — no change needed

**3. `src/components/loans/AmortizationTable.tsx` — Use draw-aware schedule**
- Accept optional `draws` prop and `hasDraws` flag
- When `hasDraws` is true, call `buildDrawAmortizationSchedule` instead of `buildAmortizationSchedule`
- Add a "Draw Funded" indicator column showing when balance increases due to a new draw
- Show per-period effective rate when it varies across draws

**4. `src/pages/LoanDetail.tsx` — Pass draws to AmortizationTable**
- Pass `draws` array and `hasDraws` flag to `AmortizationTable`

### Technical Detail: Draw-Aware Monthly Schedule Logic

```text
Month 1: Draw #1 funded ($40k @ 5.76%)
  → Balance = $40,000
  → Interest = $40,000 × 5.76% / 12 = $192

Month 2: Draw #2 funded ($50k @ 5.76%)  
  → Balance = $90,000
  → Interest = $40k × 5.76%/12 + $50k × 5.76%/12 = $432

Month 3: Draw #3 funded ($20k @ 5.76%)
  → Balance = $110,000
  → Interest = weighted sum across all draws at their rates
```

Each draw tracks its own rate. The monthly interest is the sum of `(draw_amount × draw_rate / 12)` for all funded draws as of that month. Draw fees appear as additional costs in the month the draw is funded.

### Files Modified
- `src/types/loans.ts` (add `buildDrawAmortizationSchedule`)
- `src/pages/LoanDetail.tsx` (outstanding balance from draws, pass draws to amortization)
- `src/components/loans/AmortizationTable.tsx` (render draw-aware schedule with draw indicators)

