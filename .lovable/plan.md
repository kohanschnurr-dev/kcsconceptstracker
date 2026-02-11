

## Persist Closing & Holding Cost Percentages on Save

### What this does
When you edit the closing or holding cost percentages in the Profit Calculator and click Save, those values will be saved to the database alongside Purchase Price and ARV -- so they persist when you reload or revisit the project.

### How it works
- Two new database columns store the percentages per project
- The Save button already exists; it just needs to include the new fields
- On load, the saved values are passed in as initial props (defaulting to 6% and 3% if not set)

### Technical Details

**1. Database migration**
Add two columns to the `projects` table:
- `closing_costs_pct` (numeric, default 6)
- `holding_costs_pct` (numeric, default 3)

**2. File: `src/components/project/ProfitCalculator.tsx`**
- Add `initialClosingPct` and `initialHoldingPct` to the component props (defaulting to 6 and 3)
- Initialize `closingPct` and `holdingPct` state from these props
- Add `useEffect` to sync from props (same pattern as purchasePrice/arv)
- Include `closing_costs_pct: closingPct` and `holding_costs_pct: holdingPct` in the `handleSave` update call

**3. File: `src/pages/ProjectDetail.tsx` (or wherever ProfitCalculator is rendered)**
- Pass the new columns from the fetched project data as `initialClosingPct` and `initialHoldingPct` props

