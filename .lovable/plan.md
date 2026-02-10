

## Fix: Total Interest Not Updating Correctly for "To Date" Selection

### Root Cause
When "To Date" is selected (e.g., 35 days from project start), the system:
1. Correctly calculates 35 days
2. Converts to months: 35 / 30.44 = 1.1 months (stored in `loanTermMonths`)
3. In the calculations, converts back: `Math.round(1.1 * 30.44)` = 33 days

Two days are lost in the round-trip conversion, causing the interest to be wrong ($807.55 shown vs $856.45 expected at $24.47/day x 35 days).

### Solution
Track the actual number of days separately and use it directly in interest calculations. The simplest approach: add a `termDaysOverride` state that gets set whenever "To Date" or a custom date is selected, and use it in the `calculations` and related useMemos.

### Technical Changes

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

1. **Add state for actual days**: Add a `termDaysOverride` state (number | null) that holds the exact day count when "To Date" is active.

2. **Set it when "To Date" is used**: Wherever `setLoanTermMonths(toDateMonths)` is called (initial load, button click, date picker change, reset to today), also set `termDaysOverride` to the exact day count.

3. **Clear it for preset terms**: When a fixed term button (6, 12, 18, 360) or custom month value is selected, set `termDaysOverride = null` so it falls back to the month-based calculation.

4. **Use it in calculations**: In the `calculations` useMemo, use `termDaysOverride` when available instead of `Math.round(loanTermMonths * 30.44)`:
   ```
   const termDays = termDaysOverride ?? Math.round(loanTermMonths * 30.44);
   ```

5. **Use it in rateSensitivity**: Same change -- use `termDaysOverride` when available.

6. **Use it in payoffComparison**: For the "current" entry that matches `loanTermMonths`, use `termDaysOverride` for accurate interest.

This ensures that when you pick Feb 11 (35 days from start), the calculator uses exactly 35 days: $24.47 x 35 = $856.45. Every day you pick on the calendar updates the interest precisely.
