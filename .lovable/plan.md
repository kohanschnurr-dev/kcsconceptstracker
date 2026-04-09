

## Combine Loan + Draw Interest in the Accrued Interest Card

### Problem
Currently the "Interest Accrued" card shows **either** the amortization interest (original loan) **or** the draw interest — never both. For draw-based loans, the original loan balance also accrues interest via the amortization schedule, but that's hidden.

### Solution
Combine both sources into one total and show a unified breakdown popover.

### Changes in `src/pages/LoanDetail.tsx`

**1. Compute combined total:**
```
combinedInterest = totalInterestPaid (amort through today) + drawInterest.totalInterest
```

**2. Always show breakdown when draws exist** — the popover will have:
- "Original Loan Interest" → `totalInterestPaid` (from amortization schedule through today)
- Each draw period from `drawInterest.periods` (e.g., "Draw #1 → Draw #2", "Draw #2 → Maturity")
- Separator + **Total** row

**3. Update the stat entry:**
- Label: "Interest Accrued" (drop the "(Draws)" suffix)
- Value: `fmt(combinedInterest)`
- `hasInterestBreakdown`: true when `drawInterest` exists

**4. Update the popover content** to render the "Original Loan Interest" line first, then each draw period, then total.

### Files Modified
- `src/pages/LoanDetail.tsx` (~lines 86-88, 117-121, 229-244)

