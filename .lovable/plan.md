

## Fix Loan Calculator Mobile Layout

### Problems (from screenshot)

1. **Interest Rate + Loan Term row** uses `grid-cols-[1fr_2fr]` which squeezes the rate input into a narrow column on mobile. The "Annual Interest Rate" label wraps awkwardly and the input is cramped.

2. **Term preset buttons** wrap into a messy multi-line grid within an already narrow column, creating visual clutter.

3. **KPI cards** (Monthly Payment, Total Interest, Effective APR) use `grid-cols-3` at all breakpoints, making the text tiny and hard to read on mobile.

4. **Total Loan Cost breakdown** footer line has three items in a single row that can overflow on small screens.

### Changes

**`src/components/project/HardMoneyLoanCalculator.tsx`**

1. **Stack Interest Rate and Loan Term vertically on mobile**: Change line 338 from `grid-cols-[1fr_2fr]` to `grid-cols-1 sm:grid-cols-[1fr_2fr]` so they stack into full-width sections on mobile.

2. **KPI cards responsive grid**: Change line 627 from `grid-cols-3` to `grid-cols-1 sm:grid-cols-3` so each KPI card is full-width on mobile, stacking vertically for legibility.

3. **Total Loan Cost breakdown**: Change the footer stats row (line 669) from a single `flex` row to `flex flex-wrap` or stack them vertically on mobile so they don't overflow.

### Technical Details

- Line 338: `grid-cols-[1fr_2fr]` becomes `grid-cols-1 sm:grid-cols-[1fr_2fr]`
- Line 627: `grid-cols-3` becomes `grid-cols-1 sm:grid-cols-3`
- Line 669: Add `flex-wrap gap-1` to prevent overflow on the cost breakdown row
- No database changes needed

