

## Move Closing & Holding Costs to Top-Level Input Fields

### What Changes
Move the Closing Costs and Holding Costs out of the breakdown panel and into the main input grid at the top, alongside Purchase Price and ARV. Each cost field will have its own `%/$` mode toggle and proper input, making them always visible and editable without needing to expand the breakdown.

### Layout Change

Current (2-column grid):
```text
Purchase Price          |  ARV
```

New (4-column grid, 2 rows on mobile):
```text
Purchase Price          |  ARV
Closing Costs [%|$]     |  Holding Costs [%|$]
```

Each closing/holding input will show:
- A label with the `%/$` toggle button inline
- When in `%` mode: a number input with "% of ARV" or "% of PP" helper text, plus the calculated dollar amount shown as muted text
- When in `$` mode: a standard dollar input

### Breakdown Panel Simplification
The breakdown rows for Closing Costs and Holding Costs become read-only display lines (no more inline editing there) -- just showing the label and calculated amount, since editing now happens at the top.

### File Change

**`src/components/project/ProfitCalculator.tsx`**:

1. **Expand the input grid** from `grid-cols-2` to include a second row with Closing Costs and Holding Costs fields
2. **Each cost field** gets:
   - Label with inline `%/$` toggle button (reuse existing toggle style)
   - Input for the value (percentage or flat dollar)
   - Helper text showing "% of ARV" / "% of PP" when in percentage mode, or just `$` prefix in flat mode
   - Calculated amount shown as small muted text below (e.g., "= $15,600")
3. **Simplify breakdown panel** -- remove the inline editing controls for closing/holding costs; replace with plain read-only lines showing just the label and calculated dollar amount

No new files, no database changes. The preset system continues to work as-is since it already sets these same state values.

