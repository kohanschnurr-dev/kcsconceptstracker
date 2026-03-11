

## Plan: Round Budget Numbers — No Decimals

### Change

**`src/components/budget/BudgetCanvas.tsx`** (line 151)
- Change `calculated.toFixed(2)` → `Math.round(calculated).toString()` so preset calculations produce whole numbers without decimals.

This is the source of decimal values flowing into the category input fields. The `formatCurrency` display functions already use `maximumFractionDigits: 0`, so totals are fine — it's just the individual category inputs that show trailing decimals from the preset calculation.

