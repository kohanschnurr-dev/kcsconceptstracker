

## Restructure Budget Summary into 3 Distinct Zones

Reorganize the flat pill-box layout into three visually separated sections that communicate hierarchy and scope.

### File: `src/pages/ProjectBudget.tsx` (lines 677–873)

Replace the current two equal rows + separate progress bar with:

**Zone 1 — "CONSTRUCTION BUDGET"** (wrapped in a single Card)
- Section header label: `● CONSTRUCTION BUDGET` (small, uppercase, tracking-wide, muted)
- 3-column grid inside: **Spent** (construction costs, primary color) | **Total Budget** (with edit ••• button) | **Remaining** (green/red)
- Each shows: small icon + label on top, large mono value, small subtitle underneath (e.g., "99.5% of budget", "53 categories", "On track")
- Progress bar lives directly underneath the 3 cards, inside the same Card wrapper — with the percentage text and dollar amounts flanking it

**Zone 2 — "TOTAL PROJECT SUMMARY"** (wrapped in a single Card)
- Section header: `◆ TOTAL PROJECT SUMMARY`
- 2-column grid: **Total All-In Costs** (gold/warning, with subtitle "Construction + Loan + Holding + Transaction") | **# of Expenses** (with subtitle "across all categories")
- Larger cards since only 2 columns

**Zone 3 — "ADDITIONAL COSTS"** (wrapped in a single Card)
- Section header: `— ADDITIONAL COSTS`
- 3-column grid: **Loan Costs** | **Holding Costs** | **Transaction Costs**
- Smaller/quieter styling — `text-xl` instead of `text-2xl`, muted icon colors
- Keep click-to-filter behavior on each

### Key Details
- Each zone is a `Card className="glass-card"` with its own `CardContent` containing the header label and inner grid
- The subtitles return (e.g., "99.5% of budget", "53 categories") since height matching is no longer needed — cards within each zone are peers, not across zones
- Progress bar moves from a standalone Card into Zone 1, directly under the 3 construction pills
- Remove the old `space-y-4` wrapper around the two equal rows
- The separate progress bar Card (lines 857–873) is absorbed into Zone 1
- Zone headers use `text-xs font-semibold uppercase tracking-widest text-muted-foreground` with a small decorative icon/dot

