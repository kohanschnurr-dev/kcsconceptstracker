

## Draw-Based Interest Accrual Calculator

### Problem
Currently, the amortization schedule assumes interest accrues on the full loan amount from day one. For draw-based loans (hard money, construction, etc.), interest should only accrue on the cumulative amount that has been funded at each draw point.

### Changes

**1. `src/components/loans/DrawScheduleTracker.tsx`** — Enhanced draw rows & interest summary
- Make `date_funded` editable inline (date input) so users can record when each draw was actually funded — this is critical for the calculation.
- Add an **Interest Accrual Summary** card at the bottom of the draw schedule showing:
  - Total accrued interest across all draw periods
  - Weighted average balance
  - Per-draw interest breakdown (each draw shows its funded date, amount, days outstanding, and interest accrued)
- The summary recalculates live as draws/dates change.

**2. `src/types/loans.ts`** — New utility function `buildDrawInterestSchedule`
- Accepts the loan (for rate + maturity) and the array of funded draws.
- Sorts draws by `date_funded`, then for each period between draw funding dates (and from last draw to maturity), calculates:
  - Running balance = sum of all draws funded up to that point
  - Days in period
  - Interest = balance × (annual rate / 365 or 360 depending on calc method) × days
- Returns an array of period rows plus totals.

**3. `src/components/loans/DrawScheduleTracker.tsx`** — New "Draw Interest" sub-section
- Below the draw list, render a clean table/card showing:
  - Period (e.g., "Draw 1 → Draw 2"), dates, running balance, days, interest for that period
  - Total row at bottom with cumulative interest
- Only visible when there are funded draws with dates.

**4. `src/pages/LoanDetail.tsx`** — Update summary stats
- For draw-based loans, show "Accrued Interest (Draws)" in the summary stat cards using the draw-based calculation instead of the flat calculation.

### UI Details
- Draw rows get an inline date picker for `date_funded` (appears when status is set to "funded" or can be entered manually).
- Interest summary uses the same glass-card styling with a clear breakdown table.
- Per-draw interest shown in a compact format: `Draw #1: $X,XXX (45 days @ $150,000)`.

### No database changes needed
The `loan_draws` table already has `date_funded` — we just need to make it easy to enter and use it for calculations.

