

## Pull Annual Cash Flow from Financials Data

### Problem
The ProjectCard currently computes Annual Cash Flow as a simple `(monthlyRent * 12) - totalExpenses`, but it should match the Cash Flow Calculator's formula which accounts for vacancy, mortgage P&I, property taxes, insurance, HOA, maintenance, and management fees.

### Changes

**1. `src/types/index.ts`** -- Add rental financial fields to the Project interface:
- `loanAmount`, `interestRate`, `loanTermYears`
- `annualPropertyTaxes`, `annualInsurance`, `annualHoa`
- `vacancyRate`, `monthlyMaintenance`, `managementRate`
- `cashflowRehabOverride`

**2. `src/pages/Projects.tsx`** -- Map the new DB columns to the Project object:
- `loan_amount`, `interest_rate`, `loan_term_years`, `annual_property_taxes`, `annual_insurance`, `annual_hoa`, `vacancy_rate`, `monthly_maintenance`, `management_rate`, `cashflow_rehab_override`

**3. `src/components/dashboard/ProjectCard.tsx`** -- Update the ACF calculation to match the Cash Flow Calculator formula:
- Compute monthly mortgage (P&I) using amortization formula
- Apply vacancy rate to monthly rent for gross income
- Sum monthly expenses (taxes, insurance, HOA, maintenance, management fee)
- Monthly Cash Flow = Gross Income - Mortgage - Expenses
- Annual Cash Flow = Monthly Cash Flow x 12

This ensures the card shows the exact same $3,114 figure as the Financials tab.

