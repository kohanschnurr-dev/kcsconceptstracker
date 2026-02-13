

## Rename "Rehab Costs" to "Construction Costs"

### What Changes
- Rename the "Rehab Costs" column header to **"Construction Costs"** in the Profit Breakdown table

### Note on Monthly Costs
The Monthly Costs column already pulls from actual expenses classified as "Monthly" cost type. Wales currently shows $0 because no expenses have been tagged as "Monthly" on that project's Budget tab yet. Once you classify expenses as Monthly there, the total will appear here automatically.

### Technical Steps

**`src/pages/ProfitBreakdown.tsx`**
- Line 259: Change `TableHead` text from "Rehab Costs" to "Construction Costs"
- No logic changes needed -- data sources remain the same

