

## Add Dashboard Preferences to Profit Breakdown Page

### What Changes
Add the existing `DashboardPreferencesCard` component to the bottom of the `/profit` page, below the unconfigured projects section. This gives quick access to configure which project types/statuses feed the Dashboard's Profit Potential stat without navigating to Settings.

### File Change

**`src/pages/ProfitBreakdown.tsx`**:
1. Import `DashboardPreferencesCard` from `@/components/settings/DashboardPreferencesCard`
2. Add `<DashboardPreferencesCard />` at the bottom of the page content, after the unconfigured projects section, wrapped in a `mt-6` div for spacing

No new components needed -- we reuse the existing card as-is.

