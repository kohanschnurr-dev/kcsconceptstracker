

## Rebuild Project Report -- Full Implementation

### Overview
Replace the existing basic `ProjectReport.tsx` with a comprehensive, theme-aware, print-ready report modal containing 7 sections plus header/footer. The report will use recharts for the donut chart, CSS animations for bar fills, and proper `@media print` rules. All colors use CSS variables -- zero hardcoded hex values.

### Data Flow
The `ProjectDetail.tsx` already passes `project`, `categories`, `expenses`, and company settings are fetched via `useCompanySettings`. The project object from `select('*')` contains all financial fields needed (purchase_price, arv, closing_costs_pct/mode/flat, holding_costs_pct/mode/flat, hm_loan_amount, hm_interest_rate, hm_loan_term_months, completed_date). Additional computed values (`constructionSpent`, `transactionCostActual`, `holdingCostActual`) will be passed as new props.

### Changes

**1. `src/components/project/ProjectReport.tsx` -- Complete Rewrite**

The component receives expanded props and renders a full-screen dialog with:

- **Section 1 -- Header**: Company name, project name (large), address, status badge, start date, generated date, "Project Report" pill. Uses `useCompanySettings()`.

- **Section 2 -- Budget Snapshot**: 4 stat cards (Total Budget, Total Spent, Remaining, Est. ROI) with colored top borders using `border-t-4 border-primary`, `border-destructive`, `border-success`. Budget progress bar with threshold coloring (green/amber/red). Labels: "Budget Usage" left, percentage + over/under right. Sub-labels showing $0 / Budget / Spent. Bar animates from 0 on open via CSS transition with a `useEffect` trigger.

- **Section 3 -- Days on Project**: Horizontal timeline bar (filled vs empty portion). Three inline stats: Days Elapsed, Days Remaining, Total Projected Days. Daily burn rate (Total Spent / Days Elapsed). Projected total spend by end date. If no projected end date: shows muted prompt text instead of broken UI.

- **Section 4 -- Deal Financials and ROI**: Dark header band using `bg-secondary`. Two columns:
  - Left "The Deal": Purchase Price, Rehab Cost (=constructionSpent), Loan Amount, Loan Rate, Hold Costs/Month, Total Cost Basis
  - Right "The Return": ARV, Projected Sale Price (=ARV), Selling Costs (6% of ARV), Net Proceeds, Gross Profit, Net Profit
  - Missing fields show "-- Add in Financials tab" in muted text
  - ROI result strip: Estimated ROI %, Equity/Net Profit, Hold Period (months)
  - 70% Rule indicator: green check if (Purchase + Rehab) / ARV < 0.70, red warning if not, gray if data missing

- **Section 5 -- Over/Under Budget**: Two columns. Left (red accent): categories where actual > budget, sorted by dollar variance descending. Right (green accent): categories where budget > actual, sorted by remaining descending. Empty states handled gracefully.

- **Section 6 -- Spend Breakdown**: Left: Recharts `PieChart` donut showing top 5 categories + "All Other" slice using CSS variable-derived colors. Right: Horizontal bars for all categories with spend > 0, sorted by spend descending. Each bar shows category name, spent amount, and a vertical budget marker tick. Red if over, primary if under, muted if no budget. Bars animate from 0 width.

- **Section 7 -- Scope Creep / Unbudgeted Spend**: Amber callout card listing categories with $0 budget but actual spend > 0. Hidden entirely if none exist.

- **Footer**: Company name left, project name + address + generated date right. Thin top border.

- **Print CSS**: `@media print` block hides modal chrome, close button, action buttons. Forces white background. Ensures `-webkit-print-color-adjust: exact`. Adds `page-break-before` for sections 4 and 6. Disables animations.

- **Animations**: Staggered `animate-fade-in` with increasing delays on each section (0.1s increments). Progress bars and category bars use CSS `transition-all duration-1000` triggered by a mounted state.

**2. `src/pages/ProjectDetail.tsx` -- Pass Additional Props**

Update the `<ProjectReport>` render to also pass:
- `constructionSpent` (already computed in state)
- `transactionCostActual` (already computed in state)
- `holdingCostActual` (already computed in state)

The project object already comes from `select('*')` and contains all financial columns.

**3. `src/lib/pdfExport.ts` -- No changes needed** (already has 'Project Report' docType from prior work)

### Files Changed

- `src/components/project/ProjectReport.tsx` -- full rewrite with all 7 sections, animations, print CSS, donut chart
- `src/pages/ProjectDetail.tsx` -- add 3 new props to the ProjectReport render (~3 lines changed)

