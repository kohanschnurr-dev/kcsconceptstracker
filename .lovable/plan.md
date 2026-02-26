

## Remove Wholesaling, New Construction, and Contractor Project Types

Niche down the platform to **Fix & Flip** and **Rental/BRRR** only, removing all traces of Wholesaling, New Construction, and Contractor modes.

---

### Phase 1: Convert Existing Data

Before any code changes, convert existing projects of removed types to Fix & Flip in the database so no data is lost.

- Update all projects with `project_type` in (`wholesaling`, `new_construction`, `contractor`) to `fix_flip`
- Clean up any saved profile tab orders that reference removed types

---

### Phase 2: Type System Cleanup

**`src/types/index.ts`**
- Remove `new_construction`, `wholesaling`, `contractor` from the `ProjectType` union (keep only `fix_flip` and `rental`)
- Keep `wholesale_fee` in budget categories (user chose to keep it)
- Remove `VendorTrade` entries for `general` (was contractor-specific) -- actually keep `general` as a catch-all trade

**`src/types/task.ts`** -- check for any project type references

---

### Phase 3: New Project Modal

**`src/components/NewProjectModal.tsx`**
- Change 5-column tab grid to 2-column: Fix & Flip and Rental only
- Remove `Building2`, `Handshake`, `HardHat` icons/imports for removed types
- Clean up placeholder text that references new construction, wholesaling, or contractor

---

### Phase 4: Projects Page

**`src/pages/Projects.tsx`**
- Remove `new_construction`, `wholesaling`, `contractor` from `DEFAULT_TAB_ORDER`
- Remove their entries from `TAB_CONFIG`
- Remove unused icon imports (`Building2`, `Handshake`, `HardHat`)

---

### Phase 5: Project Detail Page

**`src/pages/ProjectDetail.tsx`**
- Remove `ContractorFinancialsTab` import and usage
- Remove `FieldTab`, `CostControlTab`, `DealTab` imports and their `TabsContent` blocks
- Remove `CONTRACTOR_CORE_TABS` constant
- Simplify `DEFAULT_DETAIL_TAB_ORDER_BY_TYPE` to only `fix_flip` and `rental`
- Remove `CONTRACTOR_TAB_LABEL_OVERRIDES` and contractor-specific logic in `getTabLabel`
- Remove tab labels for `deal`, `field`, `costcontrol`
- Remove `contractor`/`wholesaling`/`new_construction` from `DBProject.project_type` union

---

### Phase 6: Project Card

**`src/components/dashboard/ProjectCard.tsx`**
- Remove contractor-specific metrics (Contract Value, Gross Margin progress bar, Job P&L)
- Remove wholesaling/new construction icon branches (`Building2`, `Handshake`, `HardHat`)
- Simplify profit/label logic (remove `isContractor`, `isWholesaling`, `isNewConstruction` branches)

---

### Phase 7: Budget Calculator

**`src/pages/BudgetCalculator.tsx`**
- Remove the Contractor tab from the analysis mode tabs
- Remove `ContractorMarginGauge` import and usage
- Keep only Sale and Rental modes

**`src/components/budget/DealSidebar.tsx`**
- Remove `contractor` from `CalculatorType`
- Remove contractor-specific sidebar logic (hiding Purchase Price/SqFt fields)

**`src/components/budget/ContractorMarginGauge.tsx`** -- can be deleted (unused after removal)

---

### Phase 8: Remove Unused Components

Delete these files that are exclusively for removed project types:
- `src/components/project/ContractorFinancialsTab.tsx`
- `src/components/project/CostControlTab.tsx`
- `src/components/project/FieldTab.tsx`
- `src/components/project/DealTab.tsx`
- `src/components/budget/ContractorMarginGauge.tsx`

---

### Phase 9: Supporting Files Cleanup

- **`src/components/project/ProjectInfo.tsx`** -- Remove `CONTRACTOR_FIELDS` and `isContractor` branching; always use property info fields
- **`src/components/settings/ManageSourcesCard.tsx`** -- Remove Job Info section referencing `CONTRACTOR_FIELDS`
- **`src/components/layout/Sidebar.tsx`** -- Check for any contractor-specific labels
- **`src/pages/Vendors.tsx`** -- UI labels say "Contractors" which is fine (industry term for vendors/subs)
- **`src/pages/ProfitBreakdown.tsx`** -- Remove contractor profit logic branches
- **`src/hooks/useProjectOptions.ts`** -- No change needed (generic query)
- **`src/data/mockData.ts`** -- Remove any mock projects with removed types

---

### What Stays Unchanged
- "Contractors" page name (industry-standard term for vendors/subcontractors)
- "Contractor" field labels on expense forms (refers to the vendor, not project type)
- `wholesale_fee` budget category (user chose to keep)
- All rental/BRRR analysis features
- Loan tab, Lease tab, Cash Flow tab for rental projects

---

### Estimated Scope
- ~15 files modified
- ~5 files deleted
- 1 database data migration (convert existing projects)
- No schema changes needed (the `project_type` column is a text field, not an enum)

