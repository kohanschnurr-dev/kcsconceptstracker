

## Add Editable Sell Closing Costs + %/$ Toggle to Estimated Costs

### What's Changing
The "Estimated Costs" section in the Budget Calculator sidebar currently hardcodes the Sell Closing at 6%. This update makes it editable (like Buy Closing and Holding already are) and adds a %/$ mode toggle so each cost field can be entered as either a percentage or a flat dollar amount.

### How It Works
- Each cost row (Closing Buy, Holding, Closing Sell) gets a small `%` / `$` toggle button
- In `%` mode, the user enters a percentage and sees the calculated dollar amount
- In `$` mode, the user enters a flat dollar amount directly
- The sell closing percentage defaults to 6% and becomes editable in the edit view
- All values (including modes) persist when saving/restoring budgets

### Technical Detail

**File: `src/pages/BudgetCalculator.tsx`**

1. Add new state variables:
   - `sellClosingPct` (string, default `'6'`)
   - `closingMode` / `holdingMode` / `sellClosingMode` (type `'pct' | 'flat'`, default `'pct'`)
   - `closingFlat` / `holdingFlat` / `sellClosingFlat` (string, default `''`)

2. Update the sell closing cost calculation from hardcoded `arvNum * 0.06` to:
   ```
   sellClosingMode === 'pct' ? arvNum * (sellClosingPct / 100) : sellClosingFlat
   ```
   Similarly update buy closing and holding to respect their modes.

3. Update `getCategoryBudgetsObject()._meta` to include the new fields for persistence.

4. Update the restore logic (lines ~155, ~245) to read the new fields from `_meta`.

5. Update the reset logic (line ~272) to reset new fields.

6. Pass new props down to `DealSidebar`.

**File: `src/components/budget/DealSidebar.tsx`**

1. Add new props: `sellClosingPct`, `onSellClosingPctChange`, `closingMode`, `holdingMode`, `sellClosingMode`, `onClosingModeChange`, `onHoldingModeChange`, `onSellClosingModeChange`, `closingFlat`, `holdingFlat`, `sellClosingFlat`, `onClosingFlatChange`, `onHoldingFlatChange`, `onSellClosingFlatChange`.

2. Add a small inline `%`/`$` toggle next to each cost label (similar to the existing mode toggle in `ProfitCalculator`).

3. In edit mode: show input with the appropriate unit based on mode. In display mode: show the label with the mode indicator and the calculated dollar value.

4. Make the sell closing row editable (currently it's display-only at hardcoded 6%) -- it appears in the edit view alongside buy closing and holding.

5. Recalculate `closingCostsSell` using the new mode/value instead of hardcoded `arvNum * 0.06`.

### Files
- **Edit**: `src/pages/BudgetCalculator.tsx` -- Add state for sell closing pct, modes, flat values; update calculations and persistence
- **Edit**: `src/components/budget/DealSidebar.tsx` -- Add %/$ toggles, make sell closing editable, accept new props

