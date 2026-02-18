
## Rework Contractor Project: Financials → "Job Financials", Team under Field, Info rework

### What's changing and why

Contractor projects currently share the same tab content as fix-and-flip projects, which makes no sense for a contractor's mental model:

- **Financials tab** shows the Profit Calculator (ARV, Purchase Price, holding/transaction costs). A contractor doesn't buy or sell properties — they bid jobs and track margin against their contract value.
- **Team tab** exists separately from Field — but for a contractor, their team IS their field operation. It belongs there contextually.
- **Info tab** shows property condition details (foundation status, HVAC year, roof type) — things a property owner cares about, not a contractor managing a job.

---

### Change 1 — Rename "Financials" → "Job P&L" for contractor projects

**New tab label**: `Job P&L` (Profit & Loss)

**New component**: `src/components/project/ContractorFinancialsTab.tsx`

Instead of Purchase Price + ARV, a contractor thinks about:
- **Contract Value** — What they were hired/paid to do the job for
- **Total Costs** (auto-pulled from budget/expenses already tracked)
- **Gross Profit** = Contract Value − Total Costs
- **Gross Margin %** = Gross Profit / Contract Value
- **Labor vs. Materials split** — two input fields for estimated labor and materials budgets
- **Status indicator** — On budget / Over budget / Under budget

Layout — a clean 2-column card grid:
```text
┌─────────────────────┬─────────────────────┐
│  Contract Value     │  Total Costs        │
│  $____________      │  $42,500 (actual)   │
├─────────────────────┼─────────────────────┤
│  Gross Profit       │  Gross Margin       │
│  $7,500             │  15.0%              │
└─────────────────────┴─────────────────────┘

Est. Labor Budget: $_____   Est. Materials: $_____

[Status pill: On Budget / Over Budget]
[ExportReports component below]
```

All values auto-save to `project_contractor_financials` table (or the existing `projects` table using spare columns). We'll store `contract_value`, `est_labor_budget`, `est_materials_budget` on the project record itself (reusing `purchase_price` for `contract_value` and `arv` won't be used — we'll add a dedicated DB column via migration).

Actually — to keep it clean without a new table, we'll:
- Use `purchase_price` as `contract_value` (relabel it)
- Store `est_labor_budget` and `est_materials_budget` in `custom_fields` JSONB on the project (or add 2 columns via migration)

We'll add a small migration: `ALTER TABLE projects ADD COLUMN est_labor_budget numeric, ADD COLUMN est_materials_budget numeric;`

---

### Change 2 — Move "Team" under "Field" tab for contractor projects

The `Field` tab currently has 3 placeholder cards (Crew & Labor, Subcontractors, Permits & Inspections — all "Coming soon").

For contractor projects, we'll:
- **Rename Field tab label** → `"Field"` (keep same name, already good)
- **Add Team section at top of Field tab** when `project_type === 'contractor'` — render `ProjectVendors` inline inside the Field tab as a "Team" section, before the coming-soon cards
- **Remove "team" from contractor tab list** in `DEFAULT_DETAIL_TAB_ORDER_BY_TYPE`

The Field tab will look like:
```text
  ┌────────────────────────────────────────┐
  │ Team / Vendors (full ProjectVendors)   │
  └────────────────────────────────────────┘
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │Crew&Labor│ │Subcontr. │ │Permits   │
  │ coming.. │ │ coming.. │ │ coming.. │
  └──────────┘ └──────────┘ └──────────┘
```

**Files touched**:
- `src/components/project/FieldTab.tsx` — accept `projectId` and `projectType` props, render `<ProjectVendors>` at top when contractor
- `src/pages/ProjectDetail.tsx` — update `DEFAULT_DETAIL_TAB_ORDER_BY_TYPE.contractor` to remove `'team'`, pass `projectType` to `FieldTab`, and add a `TabsContent value="field"` that passes those props

---

### Change 3 — Rework "Info" tab for contractor mindset

Current "Property Info" fields: Foundation Status, Gas/Electric, Roof Year, Roof Type, HVAC Year, Condenser, Furnace, Drain Line Material, Window Status, Electrical Status, Plumbing Status.

For a contractor, the "Info" tab should capture **Job Details**, not property condition:

**New fields for contractor Info**:
- **Client Name** — who hired them
- **Client Phone** — contact number  
- **Client Email** — contact email
- **Contract Type** — e.g. Fixed Price, T&M, Cost Plus
- **Scope of Work** — multiline text summary of what's in scope
- **Project Manager** — internal PM assigned
- **Site Contact** — on-site point of contact
- **Permit #** — permit number if applicable
- **Bond / Insurance #** — bond or insurance certificate reference

This is a **contractor job card**, not a property condition sheet.

**Implementation**: `ProjectInfo` currently is not type-aware. We'll make it accept a `projectType` prop. When `projectType === 'contractor'`, it renders a different set of fields stored in `custom_fields` JSONB (no schema change needed since it's all custom fields already). When any other type, behavior is unchanged.

The card title will change from "Property Info" → "Job Details" for contractor projects.

---

### Tab label changes for contractor

Update `TAB_LABELS` in `ProjectDetail.tsx`:
- Add conditional logic so when `project.project_type === 'contractor'`, `financials` label shows as `"Job P&L"` and `info` shows as `"Job Info"`

Since `TAB_LABELS` is a static record, we'll create a helper function `getTabLabel(tab, projectType)` that overrides labels by type.

---

### Technical Summary

**Files to create**:
- `src/components/project/ContractorFinancialsTab.tsx` — new Job P&L component

**Files to modify**:
- `src/pages/ProjectDetail.tsx`:
  - Add `getTabLabel()` helper for type-specific labels
  - Update `DEFAULT_DETAIL_TAB_ORDER_BY_TYPE.contractor` to remove `'team'`
  - Add `TabsContent value="field"` pass-through that passes `projectType`
  - Render `ContractorFinancialsTab` when `project_type === 'contractor'` in the `financials` TabsContent
  - Pass `projectType` to `ProjectInfo`
- `src/components/project/FieldTab.tsx` — add `projectType` prop, render `ProjectVendors` section at top for contractor
- `src/components/project/ProjectInfo.tsx` — add `projectType` prop, show contractor-specific fields (client info, scope, contract type) instead of property condition fields

**Database migration**:
- Add `est_labor_budget numeric` and `est_materials_budget numeric` columns to `projects` table for the Job P&L calculator

No existing data is affected. All other project types (fix_flip, rental, wholesaling, new_construction) are completely unchanged.
