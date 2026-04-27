## Goal

Restore the previous, taller chart layout for the loans dashboard while keeping the centered project labels under each bar.

## Changes

**`src/components/loans/LoanCharts.tsx`**

1. **Donut ("Debt by Loan Type")** — bump container height back up and grow the ring:
   - `ResponsiveContainer height={420}` (was scaled down)
   - `Pie innerRadius={90} outerRadius={155}`

2. **Bar chart ("Capital Stack by Project")** — grow vertically and keep horizontal/centered axis labels:
   - `ResponsiveContainer height={520}`
   - Keep `XAxis textAnchor="middle"`, no `angle`, `height={56}` so labels sit cleanly centered under each bar.
   - `BarChart margin={{ top: 24, right: 8, bottom: 32, left: 0 }}` to give the centered labels room without the old slanted padding.

No data, color, or legend changes — purely sizing so both panels feel substantial again like the earlier version, with the cleaner centered project names underneath.