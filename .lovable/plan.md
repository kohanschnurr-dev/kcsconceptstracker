

## Plan: Add $/PSF Mode Toggle to Construction Budget in MAO Gauge

Add a small toggle on the Construction Budget display in the MAO Gauge so users can switch between "Actual $" (current behavior) and "$/PSF" mode. In PSF mode, the user types a per-square-foot rate (e.g. 115) and the total is calculated as `rate × sqft`.

### Changes

**`src/components/budget/MAOGauge.tsx`**
- Add `sqft` prop (number) to the component
- Add a small `$ | PSF` toggle button next to the "Construction Budget" label (same style as the Profit Calculator cost mode toggles)
- In PSF mode, when editing, the input accepts a $/sqft rate; on submit, call `onBudgetTargetChange(rate × sqft)`
- Display the PSF rate as helper text when not editing (e.g. `$115/sqft`)
- Store the mode toggle locally in component state (no persistence needed — it's a quick-entry shortcut)

**`src/pages/BudgetCalculator.tsx`**
- Pass `sqft={parseFloat(sqft) || 0}` to the `<MAOGauge>` component

### UI Behavior
- Default mode: "Actual $" — current behavior unchanged
- PSF mode: user types rate → budget = rate × sqft → fires `onBudgetTargetChange`
- If sqft is 0 or missing, PSF input is disabled with a hint to enter sqft first

