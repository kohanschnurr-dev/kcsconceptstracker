

## Compact Loan Calculator Layout: Same-Row Points + Closing Costs & Smaller Interest Rate Input

### Changes to `src/components/project/HardMoneyLoanCalculator.tsx`

1. **Shrink the Annual Interest Rate column** from `grid-cols-2` (50/50) to roughly 1/3 width, giving the Loan Term buttons more room. Change the grid on line 738 from `grid grid-cols-2` to `grid grid-cols-[1fr_2fr]`.

2. **Wrap Points/Origination + Closing Costs in a 2-column grid** (lines 959-991): Put both fields side-by-side in a `grid grid-cols-2 gap-4` container, same pattern as the interest rate + loan term row.

### Technical Detail
- Line 738: change `grid grid-cols-2 gap-4` to `grid grid-cols-[1fr_2fr] gap-4`
- Lines 959-991: wrap both the Points and Closing Costs `div.space-y-2` blocks inside a single `<div className="grid grid-cols-2 gap-4">` container

