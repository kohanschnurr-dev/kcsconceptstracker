

## Trim the Report Preview Modal to Match the One-Page PDF

### Goal
Remove the "Where the Money Went", "Category Breakdown", and "Scope Creep" sections from the in-app report preview dialog so it matches the condensed one-page PDF.

### Changes in `src/components/project/ProjectReport.tsx`

**1. Remove "Where the Money Went" section (lines 531-581)**
Delete the entire donut chart section.

**2. Remove "Category Breakdown" section (lines 583-630)**
Delete the bar chart / budget-vs-spent section.

**3. Remove "Scope Creep / Unbudgeted" section (lines 632-653)**
Delete the unbudgeted spend warning section.

**4. Simplify `handleDownloadPdf`**
Since the modal no longer contains those sections, the clone-and-remove logic (removing indices 3, 4, 5) is no longer needed. The function can go back to using `reportRef.current.innerHTML` directly.

**5. Clean up unused imports and variables**
Remove references that are now only used by the deleted sections:
- `ResponsiveContainer`, `PieChart`, `Pie`, `Cell`, `Tooltip` from recharts
- `CHART_COLORS` constant
- `donutData`, `barData`, `maxBarSpent`, `scopeCreepCats` computed values

### Files Changed
- `src/components/project/ProjectReport.tsx`

