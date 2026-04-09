

## Fix Draw Interest Calculation: Per-Draw Independent Accrual

### Problem
The current `buildDrawInterestSchedule` calculates interest on a **cumulative running balance between draw dates** (Draw #1 → Draw #2 period, Draw #2 → Draw #3 period, etc.). This is wrong — each draw is an independent debt that accrues interest **from its own funding date all the way to maturity**. The draws don't pay each other off; they all run in parallel.

### Correct Model
Using the screenshot data as an example:
- **Draw #1** ($50,000) accrues interest from Aug 8, 2025 → Feb 8, 2026 (maturity) = 184 days
- **Draw #2** ($50,000) accrues interest from Jul 12, 2025 → Feb 8, 2026 = 211 days
- **Draw #3** ($20,000) accrues interest from Sep 2, 2025 → Feb 8, 2026 = 159 days

Each draw independently generates interest for its full life until maturity (or payoff).

### Changes

**`src/types/loans.ts` — Rewrite `buildDrawInterestSchedule`:**
- For each funded draw, calculate interest independently from its funding date to maturity
- Period label: "Draw #N — [Name]" (e.g., "Draw #1 — Majors")
- Each period shows: funding date → maturity, days, the draw's own amount (not cumulative), its interest
- Fees remain per-draw
- `weightedAvgBalance` recalculated as sum of (draw_amount × days) / max_days
- `totalInterest` = sum of all individual draw interests

**`src/components/loans/DrawScheduleTracker.tsx` — Update table labels:**
- Period labels change from "Draw #1 → Draw #2" to "Draw #1 — [name]" since each is independent
- No other structural changes needed; the table columns (Dates, Days, Rate, Balance, Fees, Interest) still apply

**`src/pages/LoanDetail.tsx` — Breakdown popover:**
- Already reads `drawInterest.periods` — labels will update automatically from the engine change

### Files Modified
- `src/types/loans.ts` (~lines 168-229)
- `src/components/loans/DrawScheduleTracker.tsx` (label display only, if needed)

