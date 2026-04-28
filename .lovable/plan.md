## Fix DSCR/Conventional treatment in "Debt by Loan Type" donut and Capital Stack

### The problem
1. The donut tooltip shows **"Interest Accrued"** for DSCR loans — but DSCR/conventional loans pay interest each month as part of the amortized payment. There is no accruing interest balance to show. It's misleading.
2. Because we still compute `currentAccruedInterest` for amortizing loans, an extra **lighter-blue "interest" slice** is added to the donut alongside the DSCR principal. That extra wedge is what's "shrinking" the principal slice visually. With auto-payments active, the DSCR principal segment should occupy that space on its own (and shrink naturally as months pass).
3. Same issue exists in the **Capital Stack by Project** bar chart — DSCR/conventional bars get a lighter "interest" segment stacked on top that shouldn't be there.

### What the fix does
In `src/components/loans/LoanCharts.tsx`:

- Treat amortizing loans (DSCR, conventional) as **principal-only** for both charts. Use the existing `isAmortizingLoan(loan)` helper from `src/lib/loanPayments.ts`.
- Donut chart:
  - Skip `currentAccruedInterest` entirely for amortizing loans (interest stays 0 for that loan's contribution).
  - If a loan-type aggregate ends up with `interest === 0`, omit the second pie slice and the "Interest Accrued" row from the tooltip (show only Principal + Total Owed).
  - Result: the DSCR slice is one solid blue wedge sized to the **current outstanding balance** (already computed via `effectiveOutstandingBalance` + virtual payments), which naturally shrinks each month a payment posts.
- Capital Stack bar chart: same logic — don't emit the `__interest` stack contribution for amortizing loans. The lighter-shade legend hint stays (still relevant for hard money / private money / bridge bars).

### Out of scope
No changes to `LoanStatsRow`, `PaymentHistoryTab`, or `LoanDetail` — they were already cleaned up in the previous DSCR pass. This is purely a portfolio-charts fix.

### Files touched
- `src/components/loans/LoanCharts.tsx`
