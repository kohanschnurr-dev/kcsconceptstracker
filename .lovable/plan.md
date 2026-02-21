

## Remove the 70% Rule from the Report

### Change in `src/components/project/ProjectReport.tsx`

Delete the "70% Rule" block (~lines 436-449) inside the Deal Financials section. This is the warning/info strip that shows "(Purchase + Rehab) / ARV exceeds 70%".

Also clean up any now-unused variables related to the 70% rule calculation (`seventyPctPass`, `seventyPctRatio`) if they are no longer referenced elsewhere in the component.

### Files Changed
- `src/components/project/ProjectReport.tsx`

