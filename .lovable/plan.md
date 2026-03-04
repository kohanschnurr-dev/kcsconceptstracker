

## Remove "Edit Presets" Button from Budget Canvas Header

**File: `src/components/budget/BudgetCanvas.tsx` (lines 355-362)**

Remove the "Edit Presets" button from the top toolbar (next to Expand/Collapse All). Each trade group already has its own gear icon for editing presets, making this redundant.

Just delete lines 356-362 (the `<button>` element with "Edit Presets" text). The global edit dialog and its handler can stay since the per-group gear icons likely reuse the same dialog.

