# Labor / Material Breakdown for Budget Categories

Add a global switch to the Budget Calculator that turns every category into a two-part entry: Labor $ and Material $. The category total becomes the sum of the two, and Labor vs Material totals roll up through group headers, the summary, and the exported PDF deal sheet.

## How it works

- A **Labor / Material** switch sits in the Budget Calculator header next to the existing controls. Off by default; the choice is remembered locally.
- When on, each category card swaps its single amount field for two compact fields: **Labor** and **Material**. The card shows the combined total (and $/sf if square footage is set) beneath them.
- The category total is locked to Labor + Material while the switch is on. Turning the switch off keeps the existing total intact; turning it back on restores the last split, or seeds Labor with the full amount if none exists.
- Group headers show `Labor $X · Material $Y` alongside the group total. A summary line shows the project-wide Labor vs Material split with percentages.
- Categories entered before enabling the switch stay valid — unsplit amounts count as unassigned until you fill in the two fields.

## PDF export

The deal sheet budget table gains **Labor** and **Material** columns when breakdown mode is on, plus Labor/Material totals in the table footer and a one-line split summary in the snapshot strip. When the switch is off, the PDF renders exactly as it does today.

## Saving

Splits are stored with the saved budget so reopening a budget or applying it to a project brings the breakdown back.

## Technical notes

- New state `categorySplits: Record<string, { labor: string; material: string }>` in `src/pages/BudgetCalculator.tsx`, with a `splitMode` boolean persisted to localStorage (`budget-split-mode`).
- `BudgetCategoryCard` gains `splitMode`, `split`, and `onSplitChange` props; in split mode it renders two `FormulaInput`s and calls `onCategoryChange` with the summed total so all downstream math (MAO, profit, timelines, rental/BRRRR analysis) stays untouched.
- `BudgetCanvas` passes the split props through and computes per-group labor/material subtotals from the split map.
- Persistence: splits and `splitMode` ride along in `category_budgets._meta` (`splitMode`, `splits`) in `getCategoryBudgetsObject()`, restored on template load; no schema change needed.
- `src/lib/budgetPdfExport.ts` accepts optional `splitMode` + `splits` and conditionally renders the extra columns and footer totals with the existing typography and gold accent styling.
