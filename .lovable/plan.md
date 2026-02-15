
## Remove Loan Payments Section from Loan Tab

### What Changes
Remove the `LoanPayments` component from the Loan tab across all project types. The loan calculator will remain; only the "Loan Payments" card below it will be removed.

### Files to Change
- **`src/pages/ProjectDetail.tsx`**
  - Remove the `<LoanPayments projectId={id!} />` line (line 946) from the Loan tab content
  - Remove the unused import of `LoanPayments` from line 81
