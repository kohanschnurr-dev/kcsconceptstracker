

## Fix: Monthly Payment Calculation Bugs

### Problem
Two issues inflate the displayed payment:

1. **Amortization placeholder misleads** — The field shows "360" as placeholder text (gray), but the actual value is `null`. The calculation then amortizes over the 12-month term instead of 360 months. With $58K over 12 months → ~$4,961/mo. Over 360 months → ~$306/mo.

2. **`interest_calc_method` is ignored** — `calcMonthlyPayment()` never receives or uses this field. "Simple Interest" selection has zero effect.

### Changes

**File: `src/types/loans.ts`** — Update `calcMonthlyPayment`
- Add `interestCalcMethod?: string` parameter
- When method is `"simple"`: monthly payment = `(principal / termMonths) + (principal × annualRate / 100 / 12)`
- When method is `"actual_360"` or `"actual_365"`: adjust the rate divisor accordingly (use 360 or 365 day-based rate instead of monthly)
- Default ("standard" / 30/360) stays as-is

**File: `src/components/loans/AddLoanModal.tsx`** — Pass `interest_calc_method` to the calculation
- Update the `useMemo` call on line 136 to pass `form.interest_calc_method` as the new parameter
- Add it to the dependency array

**File: `src/types/loans.ts`** — Update `buildAmortizationSchedule`
- Pass `loan.interest_calc_method` through to `calcMonthlyPayment` so the amortization table also respects the selected method

### Calculation Details

For Simple Interest ($58K, 4.85%, 12 months):
- Monthly interest = $58,000 × 4.85% / 12 = $234.42
- Monthly principal = $58,000 / 12 = $4,833.33
- Total monthly = **$5,067.75**

For Standard Amortization with 360-month amort:
- Payment ≈ **$306/mo** (plus balloon at maturity)

