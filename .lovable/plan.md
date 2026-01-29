

## Simplify Financials Tab Layout

The current Financials tab has too much visual clutter. The bar chart labels overlap, and the donut chart is overwhelmed with labels. Here's a cleaner approach.

---

## Current Problems

| Issue | Component |
|-------|-----------|
| Overlapping category labels | Budget vs Actual bar chart |
| Too many labels around donut | Spending Distribution pie chart |
| Dense breakdown table | Profit Calculator |
| Visual overload | Both cards side-by-side |

---

## Solution: Simplify Both Components

### 1. Profit Calculator - Streamline the breakdown

**Remove the detailed line-item breakdown table** (Purchase Price, Rehab Cost, Closing Costs, etc.). Keep only:
- Input fields (Purchase Price, ARV)
- 78% Rule indicator
- Profit and ROI result boxes

The breakdown details can be viewed by hovering or expanding if needed later.

### 2. Spending Chart - Remove the donut, improve the bar chart

**Remove the Spending Distribution donut chart entirely** - it duplicates information from the bar chart and creates label chaos.

**Improve the bar chart:**
- Only show top 5-6 categories with spending (most significant)
- Increase Y-axis width to prevent label truncation
- Remove the "estimated" bar - just show actual spending for simplicity
- Add a "View All" link to the Budget page for full breakdown

---

## Visual Layout After Changes

```text
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ 🧮 Profit Calculator     [Save] │  │ 📈 Spending by Category         │
├─────────────────────────────────┤  ├─────────────────────────────────┤
│ Purchase Price    │    ARV      │  │                                 │
│ [$ 154000]        │ [$ 260000]  │  │  Flooring         ████████ $6.5k│
├─────────────────────────────────┤  │  Roofing          ██████  $5.4k │
│ ✓ 78% Rule: Max offer $164,219  │  │  Drain Line       ████████ $12k │
├─────────────────────────────────┤  │  Painting         ███     $2.5k │
│ ┌─────────────┐ ┌─────────────┐ │  │  Electrical       ██      $1.1k │
│ │ Est. Profit │ │     ROI     │ │  │                                 │
│ │   $47,199   │ │    24.5%    │ │  │ Total: $38,581                  │
│ └─────────────┘ └─────────────┘ │  │                                 │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

---

## Technical Changes

### File: `src/components/project/ProfitCalculator.tsx`

**Remove lines 147-173** (the breakdown section with all the line items)

This removes:
- Purchase Price row
- Rehab Cost row
- Est. Closing Costs row
- Est. Holding Costs row
- Total Investment row
- ARV (Sale Price) row

Keep the inputs, 78% rule, and profit/ROI boxes.

### File: `src/components/project/SpendingChart.tsx`

1. **Remove the entire Pie Chart section** (lines 123-160)
2. **Update the bar chart**:
   - Filter to show only top 6 categories by actual spending
   - Remove the "estimated" bar - only show actual spending
   - Increase Y-axis width from 80 to 120 for better label visibility
   - Sort bars by spending amount (descending)
   - Update title from "Budget vs Actual by Category" to "Spending by Category"
3. **Add total spent display** at the bottom

---

## Files to Edit

| File | Changes |
|------|---------|
| `src/components/project/ProfitCalculator.tsx` | Remove detailed breakdown table (lines 147-173) |
| `src/components/project/SpendingChart.tsx` | Remove pie chart, simplify bar chart to top 6 actual spending |

---

## Result

A cleaner, more scannable Financials view that shows:
- Key profit metrics without overwhelming detail
- Top spending categories at a glance
- Clear visual hierarchy with less noise

