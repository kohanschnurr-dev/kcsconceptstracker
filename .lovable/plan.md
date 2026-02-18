

## Add "Contractor" Project Type and Standardize Detail Tabs

This is a significant feature that introduces a new project type, two new specialty tabs, and standardizes the tab configuration across all five project types.

---

### What Changes

**New Project Type: Contractor (HardHat icon)**
A fifth project type representing contractor/GC jobs. It appears alongside the existing types in the Projects page tabs and the New Project modal.

**Standardized Core Tabs (all 5 types get these 9):**
Schedule, Tasks, Financials, Documents, Team, Info, Photos, Logs, Procurement

**Specialty Tabs by Type:**
- Fix and Flip: Loan (the 9 core tabs cover everything else)
- Rental: Loan + Lease (new) + Cash Flow (existing)
- Wholesale: Loan + Deal (new)
- New Build: Loan + Field (new) + Cost Control (new)
- Contractor: Field (new) + Cost Control (new) -- no Loan tab

**Two New Tabs:**
- **Field** -- Crew/labor hours, subcontractor directory + status, permit tracking + inspection dates/results
- **Cost Control** -- Budget by phase (demo, framing, electrical...), material takeoffs per phase, change orders with approval status + cost impact

---

### Technical Details

#### 1. Database Migration
- Add `'contractor'` to the `project_type` enum
- No new tables yet for Field/Cost Control -- those will be placeholder UI components initially (the data tables can be added incrementally as the features are fleshed out)

#### 2. TypeScript Types (`src/types/index.ts`)
- Add `'contractor'` to the `ProjectType` union type

#### 3. Projects Page (`src/pages/Projects.tsx`)
- Add `contractor` to `DEFAULT_TAB_ORDER` (now 5 items)
- Add `contractor` entry in `TAB_CONFIG` with `HardHat` icon and label "Contractor"
- Update the `tabOrder` length check from `=== 4` to `>= 4` (so existing users with saved 4-tab orders still work; new tab gets appended)

#### 4. New Project Modal (`src/components/NewProjectModal.tsx`)
- Add a 5th `TabsTrigger` for Contractor with `HardHat` icon
- Update the grid from `grid-cols-4` to `grid-cols-5`
- Add placeholder text for contractor project names

#### 5. Project Detail Page (`src/pages/ProjectDetail.tsx`)
- Refactor `DEFAULT_DETAIL_TAB_ORDER` to be per-type instead of one flat array
- Define tab sets per project type:

```text
fix_flip:         schedule, tasks, financials, documents, team, info, photos, logs, procurement, loan
rental:           schedule, tasks, financials, documents, team, info, photos, logs, procurement, loan, lease, cashflow
wholesaling:      schedule, tasks, financials, documents, team, info, photos, logs, procurement, loan, deal
new_construction: schedule, tasks, financials, documents, team, info, photos, logs, procurement, loan, field, costcontrol
contractor:       schedule, tasks, financials, documents, team, info, photos, logs, procurement, field, costcontrol
```

- Add new entries to `TAB_LABELS`: `lease: 'Lease'`, `deal: 'Deal'`, `field: 'Field'`, `costcontrol: 'Cost Control'`
- Update `effectiveTabOrder` logic to use the per-type default
- Update `getDetailTabOrder` merge logic to handle different defaults per type
- Update `DBProject` interface to include `'contractor'` in `project_type`

#### 6. New Placeholder Components (4 files)
- `src/components/project/LeaseTab.tsx` -- Placeholder with "Lease management coming soon" + basic structure
- `src/components/project/DealTab.tsx` -- Placeholder for assignment details + deal analysis
- `src/components/project/FieldTab.tsx` -- Placeholder for crew, subs, permits/inspections
- `src/components/project/CostControlTab.tsx` -- Placeholder for phase budgets, takeoffs, change orders

Each will be a simple card-based layout with descriptive headers so you can see the tab structure immediately, and we can build out the full functionality incrementally.

#### 7. Tab Content Rendering (`ProjectDetail.tsx`)
- Add `TabsContent` blocks for `lease`, `deal`, `field`, and `costcontrol`
- Conditionally render based on project type (similar to how `cashflow` is handled for rentals)

#### 8. Profile Hook (`src/hooks/useProfile.ts`)
- No changes needed -- the existing `detail_tab_order` per-type persistence already supports arbitrary project types

#### 9. Sidebar / Navigation
- No changes -- Contractor projects live under the existing "Projects" nav item

---

### What This Does NOT Change (Yet)
- No new database tables for Field/Cost Control data -- those are future iterations
- The Lease tab starts as a placeholder -- full tenant/lease management is a follow-up
- The Deal tab starts as a placeholder -- full assignment tracking is a follow-up
- Existing projects and saved tab orders are preserved via the merge logic

