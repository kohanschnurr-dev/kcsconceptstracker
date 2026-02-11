

## Fix Cash-on-Cash ROI for All-Cash Deals

### The Bug

When no loan amount is entered, the calculator auto-fills it with 75% of ARV (e.g., $97,500). This inflates the "Refi Loan Amount" beyond the total investment, making "Cash Left in Deal" clamp to $0 and ROI show as 0.0% -- even though the deal is actually all-cash.

### The Fix

**File: `src/components/project/CashFlowCalculator.tsx`**

1. Change `effectiveLoanAmount` logic: when `loanAmount` is 0 (user hasn't entered a loan), treat it as an all-cash deal where `effectiveLoanAmount = 0` instead of auto-suggesting 75% of ARV
2. The suggested 75% value can still be shown as placeholder text in the loan amount input field for reference, but it should not be used in calculations unless the user explicitly enters it
3. When `effectiveLoanAmount` is 0 (all-cash):
   - Monthly mortgage = $0
   - Cash invested = total investment (purchase + rehab)
   - Cash-on-Cash ROI = Annual Cash Flow / Total Investment
4. Update the breakdown text to show "No Loan (All Cash)" instead of a loan subtraction line when loan is 0

### What the User Will See

- With no loan entered: ROI correctly reflects annual cash flow divided by total cash invested
- The loan input field shows the suggested 75% ARV as a placeholder so users know the typical value
- Entering a loan amount works exactly as before
