

## Add Filters to Profit Potential Breakdown

### What Changes
Add a row of filter buttons below the header so users can slice the profit data by **status** and **project type**. The filters apply client-side to already-fetched data, keeping things fast.

### Filter Options
A horizontal row of small toggle-style buttons:

**Status filters:**
- All Projects (removes the `status = active` constraint, shows all)
- Active (default, current behavior)
- Completed

**Project type filters:**
- All Types (default)
- Fix & Flip
- Rental
- New Construction
- Wholesaling

Both filter groups work together (e.g., "Active" + "Fix & Flip" shows only active flips).

### How It Works
1. Fetch **all** projects (remove the `.eq('status', 'active')` filter from the query) so completed projects are available too
2. Store each project's `status` and `projectType` alongside its profit data
3. Add `statusFilter` and `typeFilter` state variables
4. Filter `configured` and `unconfigured` lists client-side before rendering
5. Totals and subtitle dynamically update to reflect the filtered view

### File Changes

**`src/pages/ProfitBreakdown.tsx`**:

1. **Update interface** -- add `status` and `projectType` fields to `ProjectProfit` and the unconfigured type
2. **Remove `.eq('status', 'active')`** from the projects query so all projects are fetched
3. **Add state**: `statusFilter` (`'all' | 'active' | 'complete'`, default `'active'`) and `typeFilter` (`'all' | 'fix_flip' | 'rental' | 'new_construction' | 'wholesaling'`, default `'all'`)
4. **Store project metadata**: include `status` and `project_type` from the DB row in each `ProjectProfit` entry
5. **Filter before render**: derive `filteredConfigured` and `filteredUnconfigured` from state using both filters
6. **Add filter UI**: a flex row of small buttons between the header and the table, grouped as "Status: [All | Active | Completed]" and "Type: [All | Fix & Flip | Rental | ...]"
7. **Update subtitle** and totals to use filtered counts/sums

### UI Layout (between header and table)

```
[All] [Active] [Completed]    [All Types] [Fix & Flip] [Rental] [New Construction] [Wholesaling]
```

Small pill-style buttons; the active filter is visually highlighted (primary color). Compact, single row, matching the existing design language.

