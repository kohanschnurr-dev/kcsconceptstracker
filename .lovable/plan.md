

## Cleanup Remaining References to Removed Project Types

Several files still reference `wholesaling`, `new_construction`, and `contractor` as project type values. Here's what needs to be fixed:

---

### 1. ProjectAutocomplete.tsx - Remove old type groups

Remove `new_construction`, `wholesaling`, and `contractor` from the `PROJECT_TYPE_GROUPS` array (lines 76-78), keeping only `fix_flip` and `rental`.

### 2. DashboardPreferencesCard.tsx - Update filters and type list

- Remove the 3 old types from `DEFAULT_FILTERS.types` (line 27)
- Remove them from `PROJECT_TYPES` array (lines 34, 36-37)

### 3. Index.tsx (Dashboard) - Update default profit filters

Remove the old types from the fallback `profitFilters.types` default (line 268). Change from `['fix_flip', 'rental', 'new_construction', 'wholesaling']` to `['fix_flip', 'rental']`.

### 4. DocumentsGallery.tsx - Remove contractor-only gating

The "Generate" dropdown (Scope of Work, Invoice, Receipt) and vendor fetching are gated behind `projectType === 'contractor'`. Since no projects will ever be `contractor` type again, these features will never appear. Two options:
- **Make them available for all project types** (recommended -- these AI doc generation features are useful for flips/rentals too)
- Or remove them entirely

**Recommendation**: Make them available for all projects by removing the `projectType === 'contractor'` and `projectType !== 'contractor'` guards.

### 5. No changes needed (label-only references)

These files use "Contractor" as a **label for vendors/subcontractors** (not as a project type) and are correct to keep:
- `Expenses.tsx`, `BusinessExpenses.tsx`, `ProjectBudget.tsx`, `ExportReports.tsx` -- CSV headers saying "Contractor" (meaning the vendor column)
- `ProjectVendors.tsx` -- "Assign Contractor" UI
- `StatDrilldownModal.tsx` -- "Top Contractors" section
- `LoanPayments.tsx` -- "Lender / Contractor" label
- `MobileBottomNav.tsx` -- "Contractors" nav item (the vendors page)
- `pdfExport.ts` -- "Contractor Directory" doc type
- `NewEventModal.tsx`, `TaskDetailPanel.tsx` -- placeholder text mentioning contractor names

---

### Files to modify: 4
- `src/components/ProjectAutocomplete.tsx`
- `src/components/settings/DashboardPreferencesCard.tsx`
- `src/pages/Index.tsx`
- `src/components/project/DocumentsGallery.tsx`
