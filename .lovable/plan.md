# Loan Charts Layout & Coloring Fix

## Goal
Stop truncating project addresses in the "Outstanding Balance by Project" chart, give it more horizontal room, and color each bar by the loan type powering that project (so the bar chart visually echoes the pie chart's capital stack).

## Changes (single file: `src/components/loans/LoanCharts.tsx`)

1. **Grid rebalance** — change wrapper from `lg:grid-cols-2` to `lg:grid-cols-5`:
   - Pie card: `lg:col-span-2` (smaller), pie radii reduced (`innerRadius 60→50`, `outerRadius 100→85`)
   - Bar card: `lg:col-span-3` (wider, more room for labels)

2. **Stop truncating labels** — remove the `slice(0, 16) + '…'` so full addresses render. Compensate with:
   - Steeper rotation: `angle={-25}` → `angle={-35}`
   - Taller bottom region: `height={60}` → `height={80}`, chart `bottom` margin `50` → `70`

3. **Color bars by dominant loan type** — when grouping by project, also tally each loan type's balance for that project. Pick the dominant type and use its `LOAN_TYPE_COLORS[type].hsl` for that bar via per-bar `<Cell>` components. Result: bars match the pie slice colors, so users can read the capital stack at a glance.

## Out of scope
No data/migration changes. Pure presentational tweak.