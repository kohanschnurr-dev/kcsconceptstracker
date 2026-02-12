

## Add Quick-Edit Menu to Total Construction Budget Card

### What Changes
Add a small 3-dot (ellipsis) menu icon in the top-right corner of the "Total Construction Budget" card. Clicking it toggles the card into an inline edit mode where you can type a new total budget value directly, instead of having to adjust individual category budgets to reach the desired number.

### How It Works
1. A subtle `MoreHorizontal` (three dots) icon appears in the top-right of the Total Construction Budget card
2. Clicking it switches the card to an **edit mode** -- the dollar amount becomes an editable input field with Save/Cancel buttons
3. You type in the new total budget amount
4. On Save, the value is written to the project's `total_budget` column in the database
5. The displayed "Total Construction Budget" becomes: **whichever is greater** -- the manual override (`project.total_budget`) or the sum of categories -- so your budget floor is always honored. Alternatively, the override simply replaces the displayed value and is stored as the project-level budget.

### Technical Details

**File: `src/pages/ProjectBudget.tsx`**

1. Add state variables for edit mode and the input value:
   - `budgetEditMode` (boolean)
   - `budgetEditValue` (string)

2. Replace the static Total Construction Budget card content with a conditional render:
   - **Normal mode**: Current display + 3-dot icon button in the corner
   - **Edit mode**: Currency input field with Save/Cancel buttons

3. On Save, update `projects.total_budget` in the database via Supabase and refresh local state

4. Update `totalBudget` calculation to use the manual override when set:
   ```
   const categoryTotal = categories.reduce(...)
   const totalBudget = project?.total_budget > 0 
     ? project.total_budget 
     : categoryTotal
   ```
   This way the manual override takes precedence, but if it's 0 or unset, the sum of categories is used as before.

5. Show "from X categories" subtitle in normal mode, but show "manual override" when a custom value is active, with an option to revert to category-calculated total.

### Files Modified
- `src/pages/ProjectBudget.tsx` -- add edit mode toggle and inline budget input to the Total Construction Budget card
