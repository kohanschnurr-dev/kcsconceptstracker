## Goal
Add a single page-level toggle on `/loans` that lets the user switch the "active project data" view between **principal-only** and **principal + accrued interest**. When toggled, the change propagates to the stat cards, the table totals row, and the charts.

## Why
Right now the "Active Project Debt" stat card shows principal-only, while the table's Balance column and totals row already include accrued interest. A unified toggle removes that ambiguity and lets the user decide which basis to view across all surfaces.

## Changes

### 1. Page-level state and toggle (`src/pages/Loans.tsx`)
- Add `includeInterest` boolean state (default `false` — principal-only, matching the current stat card).
- Render a toggle/switch in the filter area labeled **"Include accrued interest"**.
- Pass `includeInterest` down to `LoanStatsRow`, `LoanTable`, and `LoanCharts`.

### 2. Stat cards (`src/components/loans/LoanStatsRow.tsx`)
- Accept new `includeInterest: boolean` prop.
- Compute accrued interest for active short-term loans (using `currentAccruedInterest` and already-fetched payments/draws).
- When `includeInterest` is true, add accrued interest to:
  - **Active Project Debt**
  - **Long-Term Rental Debt**
  - **Weighted Avg. Rate** denominator/value (balance basis)
- Subtitle/tooltip updates slightly to indicate when interest is included.
- Drill-down modal also reflects the same basis.

### 3. Table (`src/components/loans/LoanTable.tsx`)
- Accept new `includeInterest: boolean` prop.
- Update the enriched `payoff` value:
  - `includeInterest === true` → `balance + interest` (current behavior)
  - `includeInterest === false` → `balance` (principal-only)
- Keep the **Interest Balance** column visible so users still see the interest amount separately.
- Update the bottom totals row and project subtotal rows to use the same basis.
- Optionally update the Balance column header to "Balance (w/ interest)" when the toggle is on, or keep it as "Balance" with a tooltip.

### 4. Charts (`src/components/loans/LoanCharts.tsx`)
- Accept new `includeInterest: boolean` prop.
- **Pie chart** (`Debt by Loan Type`):
  - Off: one segment per loan type = principal only; hide interest segments.
  - On: one segment per loan type = principal + accrued interest combined.
- **Bar chart** (`Active Capital Stack by Project`):
  - Off: stacked bars per loan type = principal only.
  - On: stacked bars per loan type = principal + accrued interest combined.
- Hide the "Lighter shade = accrued interest" hint when interest is excluded.

## UX details
- Toggle lives near the existing Status/Purpose filter pills so it feels like a page-level view control.
- Default state is **off** so existing behavior is preserved.
- No database changes; all data is already available via existing queries.
- No changes to individual loan detail pages.

## Verification
- Open `/loans`, confirm the toggle defaults off and the "Active Project Debt" stat matches the principal-only total.
- Toggle on, confirm the stat increases by the accrued-interest amount and the table totals row + charts update to include interest.
- Switch Status/Purpose/Project-Type filters and confirm the toggle still applies to the filtered set.