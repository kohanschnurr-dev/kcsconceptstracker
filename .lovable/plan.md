

## Plan: Add New Construction Project Type

Add "New Construction" as a third project type with the same financial model as Fix & Flip (Sale/Profit) plus a Phases/Draws tab for tracking construction loan draws tied to milestones.

### Changes

**1. Type System — `src/types/index.ts`**
- Expand `ProjectType` to `'fix_flip' | 'rental' | 'new_construction'`

**2. Projects Page — `src/pages/Projects.tsx`**
- Add `new_construction` to `DEFAULT_TAB_ORDER`
- Add to `TAB_CONFIG`: label "New Construction", icon `HardHat` (lucide `HardHat`), createLabel "Build"
- The existing tab visibility, reorder, and filtering logic all works automatically

**3. New Project Modal — `src/components/NewProjectModal.tsx`**
- Change `grid-cols-2` → `grid-cols-3` for the project type tabs
- Add a third TabsTrigger for `new_construction` with HardHat icon

**4. Project Detail — `src/pages/ProjectDetail.tsx`**
- Add `new_construction` entry in `DEFAULT_DETAIL_TAB_ORDER_BY_TYPE` with the same tabs as `fix_flip` plus `'draws'`
- Add `'draws'` to `TAB_LABELS` → "Phases & Draws"
- Add a new `TabsContent` for `draws` rendering a `<PhasesDrawsTab />` component
- Update `handleConvertProjectType` to support cycling between fix_flip / new_construction / rental (dropdown menu with options instead of a single toggle)
- The `isRental` checks stay as-is — new_construction follows the same profit logic as fix_flip

**5. Project Card — `src/components/dashboard/ProjectCard.tsx`**
- Add `HardHat` icon import; show it when `projectType === 'new_construction'`
- New construction uses the same profit/budget display as fix_flip (not rental)

**6. New Component — `src/components/project/PhasesDrawsTab.tsx`**
A simple but functional tab for tracking construction loan draws:
- Displays a list of draw phases (Foundation, Framing, Dry-In, Rough-Ins, Drywall, Finishes, Final) with default milestones
- Each phase row: name, budgeted amount (editable), draw status (Pending / Requested / Funded), date funded
- Summary bar at top: Total Draws Funded vs Total Loan Amount
- Data stored in localStorage keyed by project ID initially (can migrate to DB later)
- Clean card-based UI matching existing project detail style

**7. Dashboard & Settings Updates**
- `src/components/settings/DashboardPreferencesCard.tsx` — add `new_construction` to `PROJECT_TYPES` array
- `src/pages/ProfitBreakdown.tsx` — add to `ALL_TYPES`; new_construction uses profit (not cash flow)
- `src/pages/Index.tsx` — add to default profit filter types
- `src/pages/Expenses.tsx` — handle `new_construction` in type cast
- `src/pages/Calendar.tsx` — handle in type cast

**8. Budget Calculator — `src/components/budget/DealSidebar.tsx`**
- Add `'new_construction'` to `CalculatorType` and tab config (label: "New Build", same Sale analysis)

**9. Database Migration**
- ALTER the `project_type` column's allowed values to include `'new_construction'` (if using a check constraint or enum). The column appears to be text-based, so this may just work — will verify.

### Files touched (~10 files)
- `src/types/index.ts`
- `src/pages/Projects.tsx`
- `src/components/NewProjectModal.tsx`
- `src/pages/ProjectDetail.tsx`
- `src/components/dashboard/ProjectCard.tsx`
- `src/components/project/PhasesDrawsTab.tsx` (new)
- `src/components/settings/DashboardPreferencesCard.tsx`
- `src/pages/ProfitBreakdown.tsx`
- `src/pages/Index.tsx`
- `src/pages/Expenses.tsx`
- `src/components/budget/DealSidebar.tsx`

