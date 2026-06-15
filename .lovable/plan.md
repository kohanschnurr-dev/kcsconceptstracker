## Recycle Bin for Projects

Convert project deletion into a two-stage flow: "Move to Bin" (soft delete) → "Permanently Delete" from a Recycle Bin in Settings. Restoring brings everything back automatically.

### How it works
- Clicking **Delete Project** now moves the project to the bin. It disappears from Projects, Dashboard, Calendar, Budget, Expenses, Loans, Procurement, CRM, etc.
- A new **Recycle Bin** section in **Settings** lists every binned project with: thumbnail, name, address, type, date deleted, and two actions: **Restore** and **Delete Forever**.
- A top-level **Empty Bin** button permanently purges everything (with type-to-confirm).
- Sidebar shows a small badge with bin count on the Settings icon when items exist.

### Technical details

**Schema**
- Add `deleted_at timestamptz NULL` to `public.projects`.
- Partial index: `CREATE INDEX projects_deleted_at_idx ON projects (deleted_at) WHERE deleted_at IS NOT NULL;`
- No cascade changes needed — all child rows stay intact because we no longer hard-delete.

**Data filter (every existing query)**
Audit every `from('projects')` select across hooks/pages and append `.is('deleted_at', null)`:
- `src/pages/Projects.tsx`, `Index.tsx`, `Calendar.tsx`, `Expenses.tsx`, `BusinessExpenses.tsx`, `Loans.tsx`, `Procurement.tsx`, `DailyLogs.tsx`, `Vendors.tsx`, `BundleDetail.tsx`, `Bundles.tsx`, `ProfitBreakdown.tsx`, `ProjectBudget.tsx`
- Hooks: `useProjectOptions.ts`, `useLoans.ts`, `useCRM.ts`, `useQuickBooks.ts`, `useTeam.ts`, `admin/useAdminEvents.ts`
- Modals/components that fetch projects: `NewProjectModal`, `NewVendorModal`, `NewDailyLogModal`, `CreateBudgetModal`, `*DetailModal` (when listing project options)
- `ProjectDetail.tsx`: if the loaded project has `deleted_at`, render a "This project is in the Recycle Bin" banner with **Restore** + **Delete Forever** instead of normal content.

**Delete flow rewrite (`src/pages/ProjectDetail.tsx`)**
- Replace `supabase.from('projects').delete()` with `.update({ deleted_at: new Date().toISOString() })`.
- Step-1 dialog copy: "Move **{name}** to Recycle Bin? It will be hidden from the app. You can restore it anytime from Settings → Recycle Bin."
- Remove the type-to-confirm step for soft delete (one-click move to bin is safe since it's reversible). Type-to-confirm is reserved for permanent delete in the bin.
- Toast: "Moved to Recycle Bin" with an inline **Undo** action that flips `deleted_at` back to null.

**New: `src/components/settings/RecycleBinSection.tsx`**
- Renders inside existing Settings page (append as a new card section).
- Header row: title "Recycle Bin", subtitle "{n} item(s) waiting to be restored or permanently deleted", right-side **Empty Bin** destructive button (disabled when empty).
- List rows (semantic tokens, `bg-card border border-border` sharp 2px corners):
  ```text
  [thumb] Name · Address · Type · Deleted 3 days ago      [Restore] [Delete Forever]
  ```
- **Restore**: `update({ deleted_at: null })` → toast "Project restored".
- **Delete Forever**: opens AlertDialog with type-to-confirm name → `delete().eq('id', ...)` (cascade purges children as today).
- **Empty Bin**: type "DELETE" to confirm → bulk delete all rows where `deleted_at IS NOT NULL` for the team.

**Settings badge**
- `src/components/AppSidebar.tsx`: query bin count (lightweight `count` head request, refetched on focus). Show a small `bg-destructive` numeric pill on the Settings icon when > 0.

**Counts elsewhere**
- Anywhere the UI shows "Projects (N)" tabs (Projects.tsx tab counts for New Construction / Fix & Flips / Rentals), exclude binned rows — the `.is('deleted_at', null)` filter handles it automatically since the same query backs the counts.

### Files touched
- Migration: add `deleted_at` column + index on `projects`.
- `src/pages/ProjectDetail.tsx` — soft delete + banner-when-binned.
- `src/components/settings/RecycleBinSection.tsx` — new.
- `src/pages/Settings.tsx` (or whichever file renders settings sections) — mount the new section.
- `src/components/AppSidebar.tsx` — bin count badge on Settings.
- All files listed under "Data filter" — append `.is('deleted_at', null)` to `from('projects')` selects.

### Out of scope
- No auto-purge timer (manual only, per your choice).
- No soft-delete for non-project entities (vendors, loans, etc.) — projects only for now.
