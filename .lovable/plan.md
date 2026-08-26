# Default Auto-Populated Amounts to Material (Labor/Material Split)

## Goal
In the Budget Calculator's Labor/Material split mode, any amount that gets filled in automatically should land in the **Material** field first (Labor stays blank), so you start from "all material" and carve out labor manually.

## Current behavior
When split mode is toggled on, existing category totals are seeded into the **Labor** field (`BudgetCalculator.tsx` ~line 306). Templates loaded without saved splits, imported budgets, and the auto-calculated Contingency filler leave splits empty, which triggers the "unsplit" warning in the split summary strip.

## Changes

### 1. Toggle-on seeding goes to Material
`src/pages/BudgetCalculator.tsx` — `handleSplitModeChange`
- Change the seed from `{ labor: String(total), material: '' }` to `{ labor: '', material: String(total) }`.

### 2. Template loads seed Material when no saved split exists
`src/pages/BudgetCalculator.tsx` — `handleSelectTemplate`
- After applying `meta?.splits`, for every category that has a budget amount but no split entry, seed `{ labor: '', material: <amount> }` (only while split mode is active).
- Templates that already have saved splits keep them untouched.

### 3. Imported budgets add to Material
`src/pages/BudgetCalculator.tsx` — `handleImportBudgets`
- When split mode is on, each imported amount is added to that category's **material** value (labor preserved), matching how the totals are summed.

### 4. Contingency filler auto-syncs to Material
`src/pages/BudgetCalculator.tsx` — baseline-rate `useEffect` and `handleBudgetTargetChange`
- When split mode is on and the auto filler (Contingency) value changes, set its split to `{ labor: '', material: <filler amount> }` — but only while the user hasn't entered a Labor amount for Contingency. Once labor is manually set there, the filler stops auto-syncing so it never overwrites a manual split.
- When the filler clears (0), the material seed is cleared too.

## Out of scope / unaffected
- No database or template-schema changes — splits already persist in template `_meta.splits`.
- Rollups (group headers, split summary strip) and the PDF export need no changes; they already read labor/material totals.
- Manual editing behavior in `BudgetCategoryCard` is unchanged.

## Verification
- Toggle split mode on with amounts present → all amounts appear in Material, Labor blank, no "unsplit" warning.
- Load a template with no saved splits → amounts seed into Material.
- Load a template with saved splits → splits restored exactly.
- Set a target budget / change sqft with a baseline rate → Contingency filler tracks in Material until labor is typed there.
- Save budget, reload → splits persist.
