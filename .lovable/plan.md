

## Plan: Move Presets Section Above Show/Hide Items

Swap the two sections inside the Per-Group Settings Dialog in `src/components/budget/BudgetCanvas.tsx`.

### Change

**`src/components/budget/BudgetCanvas.tsx`** (lines 487-600)

Reorder the content inside `<div className="flex-1 overflow-y-auto ...">`:
1. **Presets** section (currently lines 519-600) moves to the top
2. **Show / Hide Items** section (currently lines 488-517) moves below it

No logic changes — just swap the two `<div>` blocks.

