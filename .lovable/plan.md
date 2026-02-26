

## Show Both Equity and Cash Flow for Rental Projects

Currently, all project types use the same ARV-based profit formula. For rentals, this is labeled "Equity Gain" but it's really unrealized paper equity -- the real day-to-day metric for a rental is **Cash Flow**. This update will show **both** metrics everywhere for rental projects.

---

### 1. Project Cards -- Add Both Metrics for Rentals

**`src/components/dashboard/ProjectCard.tsx`**

The card already shows an "Annual Cash Flow" block for rentals (lines 142-174) and labels the bottom metric "Equity Gain" (line 178). Change the bottom grid for rental projects to show both:
- **Annual Cash Flow** (already calculated in the card)
- **Equity Gain** (the existing ARV-based calculation)

Restructure the bottom `grid-cols-2` section so that for rentals it shows:
- Left: **Cash Flow** (annual, from the rental calc block)
- Right: **Equity** (the current ARV-based number)

Remove the separate standalone "Annual Cash Flow" muted block above it (lines 142-174) to avoid duplication, and fold the cash flow value into the bottom grid instead. The date column moves to a row above or stays as a third column.

For flips, keep the existing layout: **Profit** | **Date**.

---

### 2. Profit Breakdown Page -- Add Columns for Rentals

**`src/pages/ProfitBreakdown.tsx`**

Add two new fields to the `ProjectProfit` interface:
- `annualCashFlow: number` -- calculated from the project's rental fields (rent, vacancy, mortgage, operating expenses)
- `isRental: boolean`

In `fetchData`, for rental projects, compute annual cash flow using the same formula as the project card (monthly rent, vacancy, loan P&I, taxes, insurance, HOA, maintenance, management).

Update the table:
- Rename "Profit" column header to **"Profit / Equity"**
- Add a new **"Cash Flow"** column (only populated for rental projects; flips show "---")
- In the footer totals row, sum cash flow across rentals

---

### 3. Dashboard Stat Card

**`src/pages/Index.tsx`**

The "Profit Potential" stat card currently sums the ARV-based profit for all projects. Update it to:
- Continue showing total **Equity** (ARV-based) as the main number
- Add a subtitle line showing total **Annual Cash Flow** from rental projects (e.g., "$24,000/yr cash flow")

This requires computing annual cash flow for each rental project in the dashboard data fetch, using the same rental fields (monthly rent, vacancy, mortgage, opex).

---

### 4. Shared Calculation Utility

To avoid duplicating the rental cash flow formula in 3+ places, extract it into a shared helper:

**New file: `src/lib/rentalCashFlow.ts`**

```
export function calcAnnualCashFlow(project): number
```

Takes the project's rental fields and returns annual cash flow. This function will be imported by ProjectCard, ProfitBreakdown, and Index.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/lib/rentalCashFlow.ts` | New shared cash flow calculator |
| `src/components/dashboard/ProjectCard.tsx` | Consolidate cash flow + equity in bottom grid for rentals |
| `src/pages/ProfitBreakdown.tsx` | Add Cash Flow column, compute for rentals |
| `src/pages/Index.tsx` | Add cash flow subtitle to Profit Potential stat card |

