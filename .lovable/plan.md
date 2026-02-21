

## Fix Report Layout and Data Display

### Changes in `src/components/project/ProjectReport.tsx`

**1. Remove "EST. ROI" card from Budget Snapshot (line 376)**
Remove the 4th stat card from the grid array and change the grid from `grid-cols-4` to `grid-cols-3`.

**2. Swap section order: Deal Financials above Budget Snapshot**
Move the "DEAL FINANCIALS & ROI" section (lines 410-492) before the "BUDGET SNAPSHOT" section (lines 367-407). Update `sectionDelay` indices accordingly.

**3. Fix Loan Rate display (line 433)**
Currently `dealField('Loan Rate', loanRate, '%')` passes the rate through `fmt()` which adds a `$` sign, producing "$6%". Replace with a dedicated rendering that shows just "6%" without the dollar sign. Change this line to use a custom display instead of `dealField`.

### Files Changed
- `src/components/project/ProjectReport.tsx`

