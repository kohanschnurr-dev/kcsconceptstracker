

## Auto-Show Filler When Budget Target Is Set

**Problem:** When the user sets a construction budget via the MAO gauge, `rehab_filler` gets populated correctly in state, but:
1. The "Filler" category may be in the hidden set (user previously hid it or it's hidden by default)
2. The "Other" group doesn't auto-expand to show the filler was populated
3. The user has no visual feedback that the filler was applied

**Changes:**

### `src/pages/BudgetCalculator.tsx`
- In `handleBudgetTargetChange`, after setting the filler value, also auto-unhide `rehab_filler` from localStorage hidden categories and auto-expand the "Other" group
- Add a ref or callback to signal the BudgetCanvas to expand the "Other" group and unhide filler
- Show a toast confirming: e.g. "Budget set to $X — $Y allocated to Filler"

### `src/components/budget/BudgetCanvas.tsx`
- Accept an optional `autoRevealCategory` prop — when set (e.g. `"rehab_filler"`), the component removes it from `hiddenCategories` and opens the parent group
- Clear the prop after handling via `onExpandHandled` (already exists for expand-all)

This ensures when the user types $100 in the construction budget field, the Filler category in the Other group immediately shows the $100 (or the difference), the group opens, and the user gets confirmation feedback.

