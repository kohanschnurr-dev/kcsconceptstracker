

## Soften the Over-Budget Styling in the Report

### Problem
When spending is only slightly over budget (e.g., $2,339 over on a $65K budget -- about 3.6% over), the heavy red/destructive styling on all three cards, the progress bar, and the "Over budget" label makes the report look alarming when it should reflect a job well done.

### Approach
Introduce a "soft over" threshold: when spending exceeds budget by a small margin (e.g., up to 5%), use **amber/warning** tones instead of **red/destructive**. Reserve the harsh red for truly significant overruns (above 5%).

### Changes in `src/components/project/ProjectReport.tsx`

**1. Add an `overPct` variable to measure how far over budget**
Calculate `overPct = ((totalSpent - totalBudget) / totalBudget) * 100` to determine severity.

**2. Update the 3 stat cards (lines 444-454)**
- **TOTAL SPENT** card: Use `border-warning` (amber) when over by 0-5%, `border-destructive` (red) only above 5%. Currently flips to red at 100%.
- **REMAINING** card: Same logic -- use `text-warning` and `border-warning` for the "soft over" range. Keep `text-destructive`/`border-destructive` for significant overruns.
- Change the sub-label from "Over budget" to something gentler for small overruns, e.g., "Slightly over" when within 5%.

**3. Update the progress bar (lines 463-471)**
- When over by 0-5%, use a `bg-warning` bar instead of the `bg-gradient-to-r from-primary to-destructive` gradient.
- Keep the red gradient for overruns above 5%.

**4. Thresholds summary**

| Condition | Card Borders | Value Color | Progress Bar | Sub-label |
|-----------|-------------|-------------|--------------|-----------|
| Under 85% used | `border-primary` | default | `bg-primary` | "Under budget" |
| 85-100% used | `border-primary` | default | `bg-warning` | "Under budget" |
| 0-5% over | `border-warning` | `text-warning` | `bg-warning` | "Slightly over" |
| 5%+ over | `border-destructive` | `text-destructive` | red gradient | "Over budget" |

### Files Changed
- `src/components/project/ProjectReport.tsx`
