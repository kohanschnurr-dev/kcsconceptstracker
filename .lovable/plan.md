

## Remove "HOW WE GET TO ROI" Header Band

### What's Being Removed
The dark header band above the Deal Financials section that reads:
- "HOW WE GET TO ROI"
- "Values pulled from project Financials tab"

### Change
In `src/components/project/ProjectReport.tsx`, delete lines 380-388 (the entire `bg-background` div containing the title and subtitle). The card container and content below it stay intact.

### Files Changed
- `src/components/project/ProjectReport.tsx`

