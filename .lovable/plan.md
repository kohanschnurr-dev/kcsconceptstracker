

## Add Principal & Interest Breakdown to Monthly Payment

### What Changes
When the loan is **not** interest-only, the Monthly Payment KPI card will show a breakdown of how much goes to principal vs. interest (based on the first month's payment). This gives immediate visibility into the payment split without changing the layout.

### Design
Below the monthly payment amount, add two small lines showing:
- **Principal**: first month's principal portion
- **Interest**: first month's interest portion

This only appears when interest-only is OFF. For interest-only loans, the entire payment is interest so no breakdown is needed.

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

1. **Add to calculations `useMemo`** (~line 182): Compute `monthlyPrincipal` and `monthlyInterestPortion` for the first payment:
   - `monthlyInterestPortion = loanAmount * monthlyRate` (first month's interest)
   - `monthlyPrincipal = monthlyPayment - monthlyInterestPortion`
   - Return both in the calculations object

2. **Update the Monthly Payment KPI card** (~lines 611-617): When `!interestOnly`, render two small sub-lines below the payment amount:
   ```
   Monthly Payment
   $224.39
   P: $99.39  |  I: $125.00
   ```
   Styled as `text-[10px] text-muted-foreground font-mono` to keep it compact within the existing card.

