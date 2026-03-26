

## Plan: Add Timeline View Toggle to Budget Calculator

### Overview
Add a Category | Timeline segmented toggle to the BudgetCanvas toolbar. Timeline view regroups the same line items into 10 chronological construction phases. No new data — purely a view-layer re-mapping.

### Changes

#### 1. New file: `src/lib/budgetTimelinePhases.ts`
Define the timeline phase configuration — an array of objects, each with a key, label, Lucide icon, and list of category values:

| Phase | Label | Icon (Lucide) | Categories |
|-------|-------|---------------|------------|
| 1 | Pre-Construction | ClipboardList | architect, permits, insurance, inspections, loan_costs, closing_costs |
| 2 | Site Work & Foundation | Shovel | demolition, driveway_concrete, foundation_repair, drain_line_repair |
| 3 | Framing & Structure | Home | framing, roofing, windows, doors |
| 4 | Rough MEPs | Zap | plumbing, electrical, hvac, natural_gas |
| 5 | Insulation & Drywall | Layers | insulation, drywall |
| 6 | Exterior | Trees | brick_siding_stucco, garage, fencing, railing, landscaping, pool |
| 7 | Finishes | Paintbrush | flooring, painting, tile, light_fixtures, hardware, trims |
| 8 | Kitchen & Bath | CookingPot | cabinets, countertops, appliances, kitchen, bathroom, main_bathroom, water_heater |
| 9 | Final Systems | Wrench | (empty by default — Gas already placed in Phase 4) |
| 10 | Closeout | CheckCircle2 | rehab_final_punch, rehab_cleaning, rehab_hoa, rehab_food, rehab_filler, rehab_misc |

Export a `buildTimelineGroups(categories)` function that maps categories into these phases (unmapped items go to a catch-all "Other" phase at the bottom), returning the same shape as `buildBudgetCalcGroups` so the rendering loop is identical.

#### 2. Modify: `src/components/budget/BudgetCanvas.tsx`

**Props**: Add optional `viewMode` and `onViewModeChange` props (or manage internally with localStorage).

**Toolbar** (line ~358-377): Add a segmented pill toggle next to the Collapse/Expand button:
```
[Collapse All]  [Category | Timeline]
```
Active segment gets `bg-primary text-primary-foreground`, inactive is transparent. Uses the same muted tan/gold palette.

**View mode state**: `useState<'category' | 'timeline'>` initialized from `localStorage.getItem('budget-view-mode')`. Persist on change.

**Rendering** (line ~614-692): Compute `displayGroups` based on view mode:
- `'category'` → existing `dynamicGroups` 
- `'timeline'` → `buildTimelineGroups(getBudgetCalcCategories())`

The existing `.map()` rendering loop stays identical — it already renders any group array with icon, name, subtotal, gear icon, and category pills. Just swap the data source.

**Transition**: Wrap the grid in a container with `key={viewMode}` and the existing `animate-in fade-in-0 duration-200` class for a subtle crossfade on toggle.

**Collapse/Expand**: Already works on `openGroups` state by group name — no changes needed since timeline phases have different names, they'll get their own open/close state entries.

**Settings gear**: In timeline view, the per-group settings dialog will show the phase's categories for hide/show and presets — works automatically since it operates on the group's category list.

#### 3. Category value mapping
The timeline phases reference the same category `value` strings used in `categoryBudgets`. Some categories from the user's screenshot that need correct mapping:

- "Filler" = `rehab_filler` (now "Contingency")
- "Final Punch" = `rehab_final_punch`
- "Cleaning" = `rehab_cleaning`
- "Food" = `rehab_food`
- "HOA" = `rehab_hoa`
- "Misc." = `rehab_misc`
- "Trims" = `trims`

I'll verify exact values from `getBudgetCategories()` in `src/types/index.ts` during implementation.

### Summary
- 1 new file (`budgetTimelinePhases.ts`) — phase definitions + grouping function
- 1 modified file (`BudgetCanvas.tsx`) — toggle UI + swap data source
- No schema changes, no new dependencies
- All dollar values shared between views via the same `categoryBudgets` state

