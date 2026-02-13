

## Allow % or Flat Dollar Amount for Closing & Holding Costs

### What Changes
Currently, Closing Costs and Holding Costs are always calculated as a percentage (of ARV and Purchase Price respectively). This change adds a toggle so users can switch between **percentage mode** and **flat dollar mode** for each cost line.

### How It Works
Each cost line (Closing, Holding) gets a small clickable toggle (e.g., "%" / "$") next to the input. When in "%" mode, it works as today. When in "$" mode, the user types a flat dollar amount directly, bypassing the percentage calculation.

### Database Migration
Add two new columns to the `projects` table:
- `closing_costs_mode` (text, default `'pct'`) -- values: `'pct'` or `'flat'`
- `holding_costs_mode` (text, default `'pct'`)
- `closing_costs_flat` (numeric, default `0`)
- `holding_costs_flat` (numeric, default `0`)

### File Changes

**`src/components/project/ProfitCalculator.tsx`**:
1. Add new props: `initialClosingMode`, `initialHoldingMode`, `initialClosingFlat`, `initialHoldingFlat`
2. Add state for each: `closingMode`, `holdingMode`, `closingFlat`, `holdingFlat`
3. Update cost calculation:
   - `closingCosts = closingMode === 'pct' ? arv * (closingPct / 100) : closingFlat`
   - `holdingCosts = holdingMode === 'pct' ? purchasePrice * (holdingPct / 100) : holdingFlat`
4. Save mode and flat values alongside pct values in `handleSave`
5. In the breakdown panel, replace the inline input with a toggle-able input:
   - A small "%" / "$" toggle button next to the label
   - In "%" mode: show the percentage input with "% ARV" / "% PP" suffix (current behavior)
   - In "$" mode: show a dollar input field directly

**`src/pages/ProjectDetail.tsx`**:
- Pass the new initial values from the project data to `ProfitCalculator`

### UI in the Breakdown (per cost line)

```
- Closing Costs [%|$]  ( 6 % ARV)          $12,270
```
vs
```
- Closing Costs [%|$]  $12,270             $12,270
```

The toggle is a small inline button pair. The active mode is visually highlighted. Switching modes preserves both values so users can flip back and forth without losing data.
