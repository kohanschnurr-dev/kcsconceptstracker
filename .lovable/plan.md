

## Add Extension Months to Amortization Schedule

### Problem
When a loan has extensions, the amortization schedule only shows the original `loan_term_months`. The extra months from extensions are not reflected, so the balloon payment appears at the wrong month.

### Changes

**1. `src/types/loans.ts`** — Update `buildAmortizationSchedule` to accept an optional `extensionMonths` parameter

- Add a second optional parameter `extensionMonths?: number` (default 0)
- Compute `effectiveTerm = term + extensionMonths`
- Use `effectiveTerm` instead of `term` in the loop bound and balloon detection (`i === effectiveTerm`)

**2. `src/components/loans/AmortizationTable.tsx`** — Pass extension months through

- Add `extensionMonths?: number` to `AmortizationTableProps`
- Pass it to `buildAmortizationSchedule(loan, extensionMonths)`
- Update total cost calculation to use the effective term

**3. `src/pages/LoanDetail.tsx`** — Calculate extension months and pass to `AmortizationTable`

- Compute `extensionMonths` from the extensions array (difference in months between `extended_from` and `extended_to` for each extension, summed)
- Pass `extensionMonths={extensionMonths}` to `<AmortizationTable>`

### Result
The amortization table will show the full schedule including extension months, with the balloon payment correctly appearing at the extended maturity date.

