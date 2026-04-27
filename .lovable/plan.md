# Capital Stack Bar Chart

## Problem
The "Outstanding Balance by Project" bar chart paints each project as a single solid color (the dominant loan type). For 2808 Old North — which has both a Boomerang **Hard Money** loan ($321k incl. funded draws) and a Morgan Stanley **Private Money** loan ($50k) — the user can't see the split.

## Solution: Stacked Bar Chart
Convert the bar chart into a true capital-stack visualization: each project bar is segmented into colored chunks per loan type, using the same colors as the pie chart.

```text
$450k │   ███          
      │   ███          
$300k │   ███   ▓▓▓    
      │   ███   ▓▓▓    ███       <-- Hard Money (green)
$150k │   ███   ▓▓▓    ███   ███
      │   ███   ▓▓▓    ███   ███   ▓▓▓ <-- Private Money (purple)
$0    └────────────────────────────────
       718Ch 2808ON NoProj Wales 534St
```

## Changes (single file: `src/components/loans/LoanCharts.tsx`)

1. **Reshape `byProject` data** — instead of `{name, balance, color}`, produce one row per project with one numeric field per loan type present, e.g.:
   ```ts
   { name: '2808 Old North Rd', hard_money: 321310, private_money: 50000, __total: 371310 }
   ```
   Also collect `presentTypes: LoanType[]` (the distinct loan types across all active loans).
   Sort by `__total` desc, slice top 8.

2. **Render one `<Bar>` per loan type** with `stackId="capital"` and `fill={LOAN_TYPE_COLORS[type].hsl}`. Apply rounded `radius={[4,4,0,0]}` only to the topmost segment.

3. **Tooltip** — format each segment with the loan-type label and dollar amount (so hovering 2808 shows both segments separately).

4. **Card title** — rename "Outstanding Balance by Project" to "Capital Stack by Project" with a small "Stacked by loan type" hint in the header.

5. **Keep**: 2/3 grid split, full address labels, -35° angle, pie chart unchanged.

## Out of scope
No data/migration changes.