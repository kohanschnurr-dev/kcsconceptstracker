
## Import Loan Details into Cash Flow Refi Section

### What Changes
Add a small "Use Loan Tab" button next to the REFI / LOAN header in the Cash Flow calculator. When clicked, it populates the Loan Amount, Interest Rate, and Loan Term fields with the values saved in the Loan tab (Hard Money Loan Calculator). Users can still manually edit these fields after importing, or ignore the button entirely.

### How It Works
1. The Loan tab saves `hm_loan_amount`, `hm_interest_rate`, and `hm_loan_term_months` to the project
2. These values get passed as new props to `CashFlowCalculator`
3. A button appears in the REFI / LOAN section header -- clicking it copies those values into the local state fields
4. Users can then tweak the numbers or leave them as-is

### Technical Details

**File: `src/pages/ProjectDetail.tsx`** (~line 1002)
- Pass three new props to `CashFlowCalculator`:
  - `hmLoanAmount={(project as any).hm_loan_amount || 0}`
  - `hmInterestRate={(project as any).hm_interest_rate || 0}`
  - `hmLoanTermMonths={(project as any).hm_loan_term_months || 0}`

**File: `src/components/project/CashFlowCalculator.tsx`**

1. **Props**: Add `hmLoanAmount`, `hmInterestRate`, `hmLoanTermMonths` (all optional, default 0)

2. **Import button**: Next to the REFI / LOAN toggle (~line 467-476), add a small button labeled "Use Loan Tab" (with a `Link` or `ArrowDownToLine` icon). Only visible when refi is enabled and HM loan data exists (hmLoanAmount > 0).

3. **On click handler**: Sets `loanAmount`, `interestRate`, and `loanTermMonths` from the HM props, and enables refi if not already on. Shows a toast confirming the import.

No database changes needed -- all data already exists in the `projects` table.
