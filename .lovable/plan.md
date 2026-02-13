

## Profit Potential Breakdown Page

### What It Does
Clicking the "Profit Potential" stat card on the dashboard navigates to a new `/profit` page that shows a per-project breakdown of how the total profit number is calculated.

### Layout

**Header**: "Profit Potential" title with a back button and the total profit number displayed prominently.

**Project Table/Cards**: Each active project with ARV > 0 shown as a row with:
- Project Name
- ARV
- Purchase Price
- Rehab Costs (shows MAX of budget vs actual, with a note indicating which is used)
- Profit = ARV - Purchase Price - Rehab Costs
- Color-coded profit (green positive, red negative)

Projects without ARV are listed separately at the bottom as "Not configured" so users know to add ARV/purchase price.

**Summary row** at the bottom with the totals.

### Changes

**New file: `src/pages/ProfitBreakdown.tsx`**
- Fetches projects, categories, and expenses (same pattern as Index.tsx)
- Calculates per-project profit using the same conservative MAX(actual, planned) logic
- Renders a table with columns: Project | ARV | Purchase Price | Rehab Costs | Profit
- Each row is clickable, navigating to that project's detail page
- Shows a summary total row at the bottom
- Projects without ARV shown in a muted section below

**File: `src/App.tsx`**
- Add route: `/profit` pointing to `ProfitBreakdown` (protected)

**File: `src/pages/Index.tsx`**
- Add `onClick={() => navigate('/profit')}` to the Profit Potential `StatCard`

### Technical Details

The new page reuses the `MainLayout`, `Table` components, and the same data-fetching pattern from `Index.tsx`. The rehab cost column will show a small label "(budget)" or "(actual)" so users understand which number is being used and why. Each project row links to `/projects/:id` for deeper drill-down.
