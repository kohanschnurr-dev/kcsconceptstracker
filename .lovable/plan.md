

## Replace Status/Phase/Finish Filters with Sort and Category Filters

### What Changes
On the project-level Procurement tab, the current "All Status", "All Phases", and "All Finishes" filter dropdowns will be replaced with more practical controls: an A-Z / price sort dropdown and a category filter dropdown.

### New Filter Bar Layout
```
[Search items or model #...]  [All Categories v]  [Sort: A-Z v]  [Add from Library]
```

### Technical Details

**File: `src/components/project/ProcurementTab.tsx`**

1. **Remove state variables**: `filterStatus`, `filterPhase`, `filterFinish`
2. **Add new state variables**: `sortBy` (default `'name_asc'`), `filterCategory` (default `'all'`)
3. **Build unique categories list** from current items (sorted alphabetically), using the existing `getCategoryLabel` logic or `BUDGET_CATEGORIES`
4. **Update filtering logic** (~line 200+): Remove status/phase/finish filtering, add category filtering
5. **Add sorting logic**: Sort by name A-Z, name Z-A, price low-high, price high-low (same options as the main Procurement page)
6. **Replace the 3 filter dropdowns** (lines 510-544) with:
   - A Category filter dropdown (All Categories + dynamically populated from items)
   - A Sort dropdown (A-Z, Z-A, Price: Low to High, Price: High to Low)
7. **Remove `uniqueFinishes`** computation since it's no longer needed for the filter

Single file change. The "Group by Phase" toggle below the filters remains untouched.
