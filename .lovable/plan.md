
## Live-Update Profit Breakdown When Preferences Change

### Problem
When you toggle checkboxes in the Dashboard Preferences card at the bottom of the Profit Breakdown page, the table and filters above don't update until you navigate away and back. The preferences are saved to localStorage immediately, but the page only reads them once on mount.

### Fix

**`src/pages/ProfitBreakdown.tsx`**

Add a `useEffect` that listens for the `'settings-changed'` event (already dispatched by the DashboardPreferencesCard on every toggle). When fired, re-read localStorage, re-derive the filter states (statusFilter, typeFilter, preferredTypes), and recompute the timeline range.

Specific changes:

1. Convert `timelineRange` from a one-time computed value to reactive state so it updates when preferences change.

2. Add a `useEffect` listener for the `'settings-changed'` window event that:
   - Re-reads `dashboard-profit-filters` from localStorage
   - Calls `setStatusFilter(deriveInitialStatus(newFilters))`
   - Calls `setTypeFilter(deriveInitialType(newFilters))`
   - Updates `preferredTypes` for multi-select scenarios
   - Updates `timelineRange` state with the new timeline/custom dates

3. Since `timelineRange` affects which projects appear in `configured`/`unconfigured` (it filters during `fetchData`), the timeline portion needs to move from the fetch phase into the `applyFilters` phase -- or, simpler: re-run `fetchData` when timeline changes. The cleanest approach is to move timeline filtering out of `fetchData` and into `applyFilters`/`useMemo` so all filtering is reactive without needing a re-fetch.

### Technical Details

- Move `isDateInRange` check from inside `fetchData` (line 178) into the `applyFilters` function, adding `startDate` to the project interfaces so it can be filtered reactively
- Add `startDate` field to both `ProjectProfit` and `UnconfiguredProject` interfaces
- Store `timelineRange` in state instead of computing once
- Listen for `'settings-changed'` event to re-read preferences and update all filter state

### Files to Change
- **`src/pages/ProfitBreakdown.tsx`** -- add settings-changed listener, move timeline filtering to be reactive, convert timelineRange to state
