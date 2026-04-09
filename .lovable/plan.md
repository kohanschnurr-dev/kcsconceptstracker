

## Include Extensions in Early Payoff Simulator

### Problem
The Early Payoff Simulator currently uses `loan.loan_term_months` as the max slider value, ignoring any extensions. If a loan has extensions, the effective term is longer and the simulator should reflect that.

### Changes

**`src/pages/LoanDetail.tsx`** — Simulator section (~lines 164-216)

1. Calculate the effective term by adding extension months to the base term:
   - Compute total extension months from the `extensions` array by summing the month difference between each extension's `extended_from` and `extended_to` dates
   - `effectiveTerm = loan.loan_term_months + totalExtensionMonths`

2. Update the simulator to use `effectiveTerm` instead of `term`:
   - Slider `max` becomes `effectiveTerm`
   - "Month X of Y" label uses `effectiveTerm`
   - Interest-at-full-term calculation uses `effectiveTerm`
   - Default `earlyPayoffMonth` (when null) becomes `effectiveTerm`

3. The interest calculation functions already scale linearly or use schedule slices, so they naturally handle months beyond the original term. For interest-only/simple loans, the formula `principal * rate / 12 * months` works for any month count. For amortizing, we cap at schedule length.

