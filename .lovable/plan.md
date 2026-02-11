
## Swap "Budget Categories" to Show the Master Category List

### Problem
The "Budget Categories" accordion in Manage Sources currently shows the $/sqft preset editor (BudgetPresetsSection). You want it to show the master list of budget categories (Demolition, Framing, Tile, etc.) that appear in the budget calculator -- the same add/remove interface used by the other category sections.

### What Changes

**File: `src/components/settings/ManageSourcesCard.tsx`**

1. Remove the `BudgetPresetsSection` import and its accordion item (lines 159-164)
2. Rename the existing "Expense Categories" accordion item (line 181) back to **"Budget Categories"** -- this already uses the `budget` custom categories hook which manages the master list of budget categories (Demolition, Framing, etc.)
3. The section currently labeled "Expense Categories" IS the budget category list -- it just needs its name corrected

### Result
- **"Budget Categories"** shows the master category list (add/remove categories like Painting, Tile, HVAC, etc.)
- The $/sqft preset editor is removed from Settings (users can adjust those directly in the Budget Calculator)

### Technical Details

Single file change in `ManageSourcesCard.tsx`:
- Remove lines 1 (BudgetPresetsSection import), 159-164 (the budgetPresets accordion item)
- Change line 181 from `Expense Categories` back to `Budget Categories`
