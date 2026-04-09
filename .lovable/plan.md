

## Break Down Interest Accrued by Original Balance + Draws

### What Changes

**`src/pages/LoanDetail.tsx`** — Add a clickable breakdown popover to the "Interest Accrued" stat card (similar to the existing "Loan Amount" breakdown), showing how much interest comes from the original balance vs. each draw.

### Logic

For draw-based loans (`drawInterest` is available):
- The `drawInterest.periods` array already tracks interest per period with running balances. Each period spans from one draw funding date to the next (or maturity).
- To show per-draw contribution, we'll attribute interest from each period proportionally to the draws that are active during that period, or more simply, display the period-level breakdown directly (e.g., "Draw #1 → Draw #2: $X interest on $Y balance").
- Show a total row at the bottom.

For non-draw loans: No breakdown needed (single source of interest).

### Implementation

1. Add `hasInterestBreakdown` flag to the Interest Accrued stat entry (true when `drawInterest` exists and has periods).
2. In the rendering loop, handle `hasInterestBreakdown` the same way as `hasBreakdown` — wrap in a `Popover` showing each period's interest contribution with labels like "Original Loan", "After Draw #1", etc., plus a total row.
3. Add `ChevronDown` indicator to signal it's clickable.

### Files Modified
- `src/pages/LoanDetail.tsx` (lines ~117-220)

