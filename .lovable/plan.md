## Replace loan-type filter pills with project-type filter pills

### What changes
On the Loans page (`src/components/loans/LoanTable.tsx`), the row of pills currently reads **All Types · Private Money · Hard Money · DSCR** (filter by *loan* type). Replace it with **All Projects · Fix & Flips · Rentals · New Construction** (filter by *project* type).

The existing dropdown filters (Status, All Projects by name) stay exactly as they are.

### How
1. Fetch project_type for every project referenced by the loans on this page. Use the existing pattern from `useProjectOptions` — single Supabase query: `select('name, project_type').in('name', projectNames)`. Keyed on the sorted project-name list.
2. Build a `projectTypeByName: Map<string, 'fix_flip'|'rental'|'new_construction'>`.
3. Replace `typeFilter` (loan_type) with `projectTypeFilter: 'all' | ProjectType`.
4. Filter rule: `if (projectTypeFilter !== 'all') list = list.filter(l => projectTypeByName.get(l.project_name) === projectTypeFilter)`.
5. Render the pills as a fixed set of four (always visible if loans cover ≥1 project type):
   - All Projects
   - Fix & Flips
   - Rentals
   - New Construction
   Selected pill uses primary tint (same `bg-primary/15 text-primary border-primary/40` style as the current "All Types" active state) for a single, consistent look — no per-type color swatches (those mapped to loan colors which no longer apply).
6. Loans whose `project_name` doesn't match a known project (e.g., null / standalone loans) are excluded by every non-"All" filter, which matches user expectation.

### Out of scope
- The loan-type dimension remains visible via the existing **Type** column header and the loan-type colors in charts/tooltips. We're only swapping the filter pills.
- No schema changes.

### Files touched
- `src/components/loans/LoanTable.tsx`
