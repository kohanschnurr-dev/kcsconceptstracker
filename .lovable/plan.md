

## Unify Budget Calculator with Expense Categories

### Problem
The Budget Calculator and Expense Categories are two separate lists. If a category exists in the calculator but not in expenses, budgets won't transfer cleanly to projects. They should be the same master list -- the Budget Calculator just needs to visually organize them into trade groups.

### Approach
Instead of maintaining a separate "Budget Calculator Categories" list, the Budget Calculator will pull from the Expense Categories (`custom-budget-categories` / `BUDGET_CATEGORIES`) and use a static group mapping to organize them into trade groups (Structure, MEPs, Finishes, etc.). Categories not in the mapping default to "Other".

### Changes

**1. `src/lib/budgetCalculatorCategories.ts`** -- Rework to be a mapping file
- Keep `BUDGET_CALC_GROUP_DEFS` (group labels and icons) as-is
- Replace `DEFAULT_BUDGET_CALC_CATEGORIES` with a static `CATEGORY_GROUP_MAP: Record<string, string>` that maps category values to group keys (e.g., `demolition -> structure`, `electrical -> meps`)
- Update `getBudgetCalcCategories()` to call `getBudgetCategories()` from `@/types`, then enrich each category with its group from the map (unmapped categories get `group: 'other'`)
- Update `buildBudgetCalcGroups()` accordingly

**2. `src/components/settings/ManageSourcesCard.tsx`** -- Remove the Budget Calculator Categories section
- Remove the `budgetCalc` accordion item (lines 228-240)
- Remove the `budgetCalcGrouped` prop/logic from `CategorySection` since it's no longer needed
- Remove related imports (`DEFAULT_BUDGET_CALC_CATEGORIES`, `BUDGET_CALC_GROUP_DEFS`)
- Remove the `budgetCalc` `useCustomCategories` hook call
- The "Expense Categories" section becomes the single source of truth; display it grouped by trade groups (using the same group mapping) so users can see how their categories will be organized in the calculator

**3. `src/components/budget/BudgetCanvas.tsx`** -- No structural changes needed
- The existing calls to `getBudgetCalcCategories()` and `buildBudgetCalcGroups()` will continue to work since those functions are being updated to pull from expense categories internally

**4. `src/hooks/useCustomCategories.ts`** -- Clean up
- Remove `budgetCalc` from `CategoryType` and `STORAGE_KEYS` since it's no longer a separate category type

**5. Expense Categories display in Settings** -- Add trade group visualization
- Update the Expense Categories section to use grouped rendering (similar to what Budget Calculator Categories had) so users can see their categories organized by Structure, MEPs, Finishes, etc.
- When adding a new category, include the group selector so it gets assigned to the right trade group
- This replaces the flat badge list with the grouped view

### Group Mapping (built into `budgetCalculatorCategories.ts`)
- **Structure**: demolition, framing, foundation_repair, roofing, drywall, insulation
- **MEPs**: electrical, plumbing, hvac, natural_gas, water_heater, drain_line_repair
- **Finishes**: painting, flooring, tile, doors, windows, hardware, light_fixtures
- **Kitchen & Bath**: kitchen, bathroom, main_bathroom, cabinets, countertops, appliances
- **Exterior**: landscaping, fencing, driveway_concrete, garage, pool, brick_siding_stucco, railing
- **Other**: everything else (permits_inspections, dumpsters_trash, cleaning, final_punch, staging, carpentry, pest_control, misc, rehab_filler, closing_costs, food, hoa, insurance_project, taxes, utilities, variable, wholesale_fee, and any custom categories)

### Result
- One category list to manage (Expense Categories)
- Budget Calculator automatically reflects any changes to expense categories
- Categories are visually grouped in both Settings and the Calculator
- Budgets created in the calculator will always map 1:1 to project expense categories
