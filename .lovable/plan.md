

## Add Timeline Filter to Dashboard Preferences

### What Changes
A new "Timeline" section will be added to the Dashboard Preferences card, allowing you to scope dashboard profit and budget stats to a specific time window. Options include preset ranges and a custom date picker.

### Timeline Options
- **All Time** (default) -- no date filtering, current behavior
- **This Year** -- current calendar year
- **Last 6 Months** -- rolling 6 months from today
- **Last 12 Months** -- rolling 12 months from today
- **Custom Range** -- pick specific start and end dates via date pickers

### How It Works
- The selected timeline is saved alongside the existing type/status filters in the same `dashboard-profit-filters` localStorage key and synced across devices
- The Dashboard page reads the timeline preference and filters projects and expenses by their dates before calculating stats (Profit Potential, Total Budget, This Month)
- For project-based stats, projects are filtered by `start_date` falling within the range
- Preset options use radio buttons for single selection; "Custom Range" reveals two date pickers inline

### Technical Steps

**1. `src/components/settings/DashboardPreferencesCard.tsx`**
- Extend the `ProfitFilters` interface with `timeline` (string, e.g. `'all'`, `'this_year'`, `'6_months'`, `'12_months'`, `'custom'`) and optional `timelineStart` / `timelineEnd` date strings
- Update `DEFAULT_FILTERS` to include `timeline: 'all'`
- Add a new "Timeline" section with radio buttons for each preset
- When "Custom Range" is selected, show two date pickers (start/end) using the Shadcn Popover + Calendar pattern
- Save changes through the existing `save()` flow which triggers settings sync

**2. `src/pages/Index.tsx`**
- Read the `timeline`, `timelineStart`, and `timelineEnd` fields from the parsed `dashboard-profit-filters`
- Create a helper that resolves the timeline preset into a `{ start: Date, end: Date }` range
- Apply the date range filter to `filteredProfitProjects` (filter by `startDate`) before calculating profit potential
- Apply the same filter to `activeProjects` for Total Budget calculation
- The "This Month" stat remains unaffected (it always shows current month)

**3. `src/pages/ProfitBreakdown.tsx`**
- Apply the same timeline filter to the profit breakdown table so it stays consistent with the dashboard number

