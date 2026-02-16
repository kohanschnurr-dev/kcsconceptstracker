

## Save All Deal Parameters with Budget

### Problem
Currently, saving a budget only stores name, description, purchase price, ARV, sqft, and category budgets. It does NOT save rental fields (monthly rent, vacancy, taxes, insurance, loan settings, etc.), closing/holding percentages, calculator type toggle, or the sell-closing-costs toggle. When you reload a saved budget, all those entries are lost.

### Solution
Store all deal parameters inside the existing `_meta` key of the `category_budgets` JSONB column -- no database migration needed.

### What Gets Saved (new additions)
- Calculator type (fix_flip / rental) -- already partially saved
- Closing cost percentage
- Holding cost percentage
- Include sell closing costs toggle
- All rental fields: monthly rent, vacancy rate, annual taxes, annual insurance, annual HOA, monthly maintenance, management rate, loan enabled, LTV, loan amount, rate, term, points, points mode, LTV base

### Technical Changes

**File: `src/pages/BudgetCalculator.tsx`**

1. **`handleSave`** -- expand the `category_budgets` object to include a richer `_meta`:
   ```
   _meta: {
     type: calculatorType,
     closingPct,
     holdingPct,
     includeSellClosingCosts,
     rentalFields,
   }
   ```

2. **`loadDefaultTemplate`** and **`handleSelectTemplate`** -- when restoring a template, read `_meta` and restore:
   - `closingPct` / `holdingPct` (falling back to '2' / '3')
   - `includeSellClosingCosts` (falling back to `true`)
   - `rentalFields` (falling back to `defaultRentalFields`)
   - `calculatorType` (already done, no change)

3. **`handleClearAll`** -- already resets `rentalFields` to defaults; also reset `closingPct` to '2', `holdingPct` to '3', `includeSellClosingCosts` to `true`.

No database migration or new columns needed -- everything fits in the existing JSONB field.

