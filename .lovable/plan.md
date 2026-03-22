

## Plan: Three-Mode Construction Budget Selector

### Problem
Currently the Construction Budget field has a binary toggle (Auto / Manual). The user wants three options: **Budget** (from project budget categories), **Spent** (actual total spent), and **Manual** (free input) — presented as a sleek segmented control instead of a switch.

### Changes

**`src/components/project/CashFlowCalculator.tsx`**

1. Replace the `useManualRehab` boolean state with a `rehabMode` state: `'budget' | 'spent' | 'manual'` (default: `'budget'`, or `'manual'` if `initialRehabOverride != null`)

2. Replace the Switch + "Manual" label with a compact segmented pill control (3 buttons styled like the existing `PeriodToggle`):
   - **Budget** → uses `totalBudget` (current auto behavior)
   - **Spent** → uses `totalSpent` (already available as a prop)
   - **Manual** → editable input (current manual behavior)

3. Update `activeRehabBudget` logic:
   ```
   budget → totalBudget
   spent  → totalSpent
   manual → rehabOverride
   ```

4. Input field: read-only/disabled when mode is `budget` or `spent`; editable when `manual`

5. Helper text below input: "Auto from project budget" / "Auto from total spent" / removed for manual

6. Save logic: persist `cashflow_rehab_override` only when mode is `manual`; store null otherwise

7. On init: if `initialRehabOverride != null` → `'manual'`; else `'budget'`

### UI Preview
```text
Construction Budget   [ Budget | Spent | Manual ]
$ 65616              Auto from project budget categories
```

Segmented control uses the same `PeriodToggle` styling already in the component — small rounded pills with primary highlight on the active option.

