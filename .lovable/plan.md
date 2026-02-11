

## Fix Vacancy/Maintenance/Management Save + Swap Positions + Add Preset Gear

### Problem
When you set Management to 0 and save, it reloads as 10. This is because `project.management_rate || 10` treats `0` as falsy and falls back to `10`. Same issue exists for Vacancy (falls back to 8). The `value={managementRate || ''}` pattern also hides `0` in the input, making it look empty.

### Changes

**1. Fix the fallback bug (`src/pages/ProjectDetail.tsx`, lines 681-683)**
- Change `project.vacancy_rate || 8` to `project.vacancy_rate ?? 8`
- Change `project.monthly_maintenance || 0` to `project.monthly_maintenance ?? 0`
- Change `project.management_rate || 10` to `project.management_rate ?? 10`
- This preserves `0` as a valid saved value

**2. Fix input value display (`src/components/project/CashFlowCalculator.tsx`)**
- For Vacancy, Maintenance, and Management inputs: change `value={x || ''}` to properly show `0` when the value is `0` (use a helper like `value={x !== null && x !== undefined ? x : ''}` or simply allow 0 to display)

**3. Swap Maintenance and Vacancy positions (same file, lines 363-412)**
- Current order: Taxes, Insurance, HOA, **Vacancy**, **Maintenance**, Management
- New order: Taxes, Insurance, HOA, **Maintenance**, **Vacancy**, Management

**4. Add a gear icon for preset Vacancy % and Management % (same file)**
- Add a small gear icon next to the EXPENSES section header
- Clicking it opens a popover with two inputs: default Vacancy % and default Management %
- Presets are stored in localStorage (e.g., `cashflow-presets`)
- When creating/opening a new project with no saved values, these presets auto-fill the fields
- The gear provides a quick way to set your standard rates across projects
