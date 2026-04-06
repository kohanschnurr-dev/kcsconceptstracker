

## Plan: Color Gantt Bars by Category Group

Currently, Gantt bars are colored by budget health (green/yellow/red), making all bars look the same emerald color. The user wants bars colored by their **category group** to match the legend (Acquisition/Admin = blue, Structural/Exterior = red, Rough-ins = orange, Inspections = purple, Interior Finishes = green, Milestones = amber).

### Changes — `src/components/calendar/GanttView.tsx`

**Replace `getBarColor` logic (lines 82–88)**
- Instead of coloring by `task.budgetHealth`, color by the task's category group using `getCategoryGroup` + `CATEGORY_GROUPS`
- Map each group to a solid Tailwind bg class:
  - `acquisition_admin` → `bg-blue-500`
  - `structural_exterior` → `bg-red-500`
  - `rough_ins` → `bg-orange-500`
  - `inspections` → `bg-purple-500`
  - `interior_finishes` → `bg-emerald-500`
  - `milestones` → `bg-amber-500`
- Completed tasks get a slightly muted variant (e.g., `opacity-60`) instead of overriding the color

**Add import for `CATEGORY_GROUPS`**
- Already importing `getCategoryGroup`; add `CATEGORY_GROUPS` to the import

### Result
Bars will visually match the color legend at the bottom — blue for admin tasks, orange for rough-ins, etc. — giving an instant visual grouping by trade/phase.

### Files
- `src/components/calendar/GanttView.tsx` (only file)

