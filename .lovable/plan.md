

## Extend Yr/Mo Toggle to Insurance & Maintenance + Improve Toggle Style

### What Changes
1. Add the same month/year toggle to **Insurance** and **Maintenance** fields (currently they're fixed to /yr and /mo respectively)
2. Restyle all four toggles (Property Taxes, Insurance, HOA, Maintenance) from the current `/yr` pill to a segmented **Yr / Mo** toggle where the active option is visually highlighted, making it obvious users can switch

### Technical Details

**File: `src/components/project/CashFlowCalculator.tsx`**

**1. Add state for new toggles (lines ~59-60)**
- Add `insurancePeriod: 'month' | 'year'` (default `'year'`)
- Add `maintenancePeriod: 'month' | 'year'` (default `'month'`)

**2. Create a reusable inline toggle component**
Replace the current single-pill button with a two-segment toggle showing "Yr" and "Mo" side by side. The active segment gets a highlighted background (e.g., `bg-primary/20 text-primary`), the inactive one stays muted. Example markup:

```text
Property Taxes  [Yr | Mo]
```

Where the active side is visually distinct. Implemented as a small inline component or repeated markup for each of the 4 fields.

**3. Update Insurance field (lines ~299-311)**
- Replace `<Label>Insurance/yr</Label>` with the label "Insurance" + the Yr/Mo toggle
- Add display/input conversion logic: when monthly mode, show `annualInsurance / 12`; on input, multiply by 12

**4. Update Maintenance field (lines ~354-366)**
- Replace `<Label>Maintenance/mo</Label>` with "Maintenance" + the Yr/Mo toggle
- Maintenance currently stores as monthly (`monthlyMaintenance`). When yearly mode is selected, display `monthlyMaintenance * 12`; on input, divide by 12

**5. Restyle existing Property Taxes and HOA toggles (lines ~274-282, 314-322)**
- Replace the current single `/yr` or `/mo` pill with the same two-segment Yr/Mo toggle style

### Toggle Style
Each toggle is a small inline element next to the label:

```text
[Yr | Mo]     -- "Yr" highlighted when yearly is active
[Yr | Mo]     -- "Mo" highlighted when monthly is active
```

Both segments are always visible. The active one uses `bg-primary/20 text-primary font-bold` and the inactive one uses `text-muted-foreground`.

