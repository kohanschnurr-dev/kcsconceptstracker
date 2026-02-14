

## Fix Holding Costs Mode Reverting to %

### Problem
When you select "$" for Holding Costs and click Save, the value saves correctly to the database. However, the Profit Calculator doesn't notify the parent page to refresh its data. So if anything else on the page triggers a re-render, the stale parent data (still showing "%") overwrites your selection.

The CashFlow Calculator already has this fix (`onSaved` callback) but the Profit Calculator is missing it.

### Changes

**1. `src/components/project/ProfitCalculator.tsx`**
- Add an `onSaved?: () => void` callback prop to the interface
- Call `onSaved()` after a successful save in `handleSave`

**2. `src/pages/ProjectDetail.tsx`**
- Pass `onSaved={() => fetchProjectData(false)}` to the ProfitCalculator component (same pattern already used by CashFlowCalculator on line 887)

This ensures that after clicking Save, the parent page re-fetches the project with the correct mode values from the database, preventing any revert.
