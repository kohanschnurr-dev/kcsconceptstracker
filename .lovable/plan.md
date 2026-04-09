

## Rename "Original Amount" to "Loan Amount" for Non-Traditional Loans

### What Changes

**`src/pages/LoanDetail.tsx`** — Update the first summary stat card:

1. **Label logic**: If `loan.loan_type` is `'conventional'` or `'dscr'`, keep label as "Original Amount". For all other types, label it "Loan Amount".

2. **Value logic**: For non-conventional/non-DSCR loans with draws, the "Loan Amount" value = `loan.original_amount` + sum of all draw amounts. For conventional/DSCR or loans without draws, show `loan.original_amount` as before.

3. **Click-to-expand breakdown**: Make the stat card clickable (for non-conventional/non-DSCR loans with draws). On click, show a popover or expandable section beneath the card listing:
   - Original Loan: $X
   - Draw #1: $X (with label/description if available)
   - Draw #2: $X
   - **Total: $X**

### Technical Detail

```typescript
const isTraditional = loan.loan_type === 'conventional' || loan.loan_type === 'dscr';
const totalDrawAmount = draws.reduce((s, d) => s + (d.amount ?? 0), 0);
const loanAmountValue = isTraditional ? loan.original_amount : loan.original_amount + totalDrawAmount;
const loanAmountLabel = isTraditional ? 'Original Amount' : 'Loan Amount';
```

The breakdown popover will use the existing `Popover` component from the UI library, triggered by clicking the stat card. It will list each draw with its amount and a total row.

### Files Modified
- `src/pages/LoanDetail.tsx`

