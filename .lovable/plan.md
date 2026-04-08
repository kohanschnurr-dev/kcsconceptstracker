

## Loan Compare & Contrast Mode

### Approach

Add a "Compare" mode to the Loans page where users can select 2-3 loans from their table via checkboxes, then view a side-by-side comparison panel. This is the most natural UX since the loans already exist in the table — no need for a separate page or manual data entry.

### Changes

**1. New component: `src/components/loans/LoanComparePanel.tsx`**

A side-by-side comparison card that receives an array of Loan objects and displays:
- **Header row**: Loan nickname/lender per column
- **Key metrics rows** (side-by-side):
  - Loan Amount / Balance
  - Interest Rate / Rate Type
  - Loan Term
  - Monthly Payment
  - Origination Fee (points + dollars)
  - Other Closing Costs
  - Total Cost of Loan (principal + total interest + origination + closing costs, computed via `buildAmortizationSchedule`)
  - Total Interest Paid
  - Effective APR (total cost annualized)
- **Winner highlighting**: Green highlight on the better value in each row (lower rate, lower total cost, etc.)
- **Summary verdict**: "Loan A saves $X over the life of the loan" at the bottom
- Dismiss button to exit compare mode

**2. Update `src/components/loans/LoanTable.tsx`**

- Add a `compareMode` prop and checkbox column when active
- Track selected loan IDs (max 3)
- Expose selected IDs via callback

**3. Update `src/pages/Loans.tsx`**

- Add a "Compare" toggle button in the header (next to "Add Loan")
- When compare mode is on, show checkboxes in the loan table
- When 2+ loans are selected, render `LoanComparePanel` above/below the table
- Exit compare mode clears selections

### Technical Details

- Reuses `buildAmortizationSchedule` and `calcMonthlyPayment` from `src/types/loans.ts` for total interest/cost calculations
- No database changes needed — purely client-side comparison of existing loan records
- Comparison highlights use existing Tailwind classes (`text-success`, `text-destructive`, `bg-success/10`)

