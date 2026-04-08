

## Auto-default Interest Calculation to Simple Interest

When the user selects a loan type, automatically set the interest calculation method based on the type:
- **Conventional** and **DSCR** → `standard` (30/360)
- **All other types** (Hard Money, Private Money, Seller Financing, HELOC, Bridge, Construction, Portfolio, Other) → `simple`

Also update the initial default from `standard` to `simple` since Hard Money is the default loan type.

### Changes

**`src/components/loans/AddLoanModal.tsx`**
1. Change the `empty()` default for `interest_calc_method` from `'standard'` to `'simple'` (since default loan type is `hard_money`).
2. In the `loan_type` `onValueChange` handler, add logic: if the new type is `conventional` or `dscr`, set `interest_calc_method` to `'standard'`; otherwise set it to `'simple'`.

