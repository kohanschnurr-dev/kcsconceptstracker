
## Redesign the ContractorMarginGauge — Sleek Target + Gross Margin Display

### What's Wrong (from the screenshot)

The top-right corner of the gauge has three separate pieces crammed together:
- `Target:  [20]  %` (inline label + input + unit)
- `GROSS MARGIN` (small caps label)
- `80.0%` (large number)

This creates visual clutter. The "Target:" label reads like a form field floating mid-air, disconnected from the metric it governs. The layout also feels misaligned — the three stats on the left are icon-driven cards, but the right side is just raw text.

---

### Redesign Goals

1. **Integrate the target into the margin display** — instead of a standalone "Target: [20] %" row above the label, embed the editable target as a subtle inline annotation **below** the margin percentage, like a badge or a single-line inline control.
2. **Add a circular/arc indicator or a cleaner badge** for the margin status — a small colored pill or ring next to the percentage gives instant visual status without noisy text.
3. **Make the right stat block consistent** with the left three — same icon-card structure, same spacing.
4. **Clean up the progress bar section** — remove the redundant `margin% margin` label on the right (it duplicates the big number above), tighten spacing.

---

### New Layout Design

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [$ icon] CONTRACT VALUE   [↗ icon] JOB COST   [✓ icon] GROSS PROFIT   [%]  │
│  $50,000                   $10,000               $40,000             80.0%   │
│                                                              ● Target: 20%   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  0%                        ↑ target (20%)                             40%+  │
└──────────────────────────────────────────────────────────────────────────────┘
```

The right stat block becomes:

```
[GAUGE icon]  GROSS MARGIN
              80.0%
              ● Target [20] %   ← small inline control, muted
```

This keeps the icon-card structure consistent with the other three stats but adds the editable target as a compact sub-line.

---

### Specific Changes to `ContractorMarginGauge.tsx`

#### A. Right stat block restructure

Replace the current `div.text-right` with a proper icon-card like the other three:

```tsx
<div className="flex items-center gap-2">
  {/* Status ring icon — colored by margin status */}
  <div className={cn('p-1.5 rounded-lg', statusBgColor)}>
    <Percent className={cn('h-4 w-4', marginColor)} />
  </div>
  <div>
    <p className="text-xs text-muted-foreground uppercase tracking-wide">Gross Margin</p>
    <p className={cn('text-2xl font-bold font-mono leading-none', marginColor)}>
      {hasValidData ? `${margin.toFixed(1)}%` : '—'}
    </p>
    {/* Target inline — compact, below the number */}
    <div className="flex items-center gap-1 mt-1">
      <div className={cn('w-1.5 h-1.5 rounded-full', isGreen ? 'bg-green-500' : isAmber ? 'bg-amber-500' : 'bg-destructive')} />
      <span className="text-xs text-muted-foreground">Target</span>
      <input
        type="number"
        value={marginTarget}
        onChange={...}
        className="w-8 h-4 text-xs font-mono text-center rounded border border-input bg-background/80 px-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
        min={1} max={99}
      />
      <span className="text-xs text-muted-foreground">%</span>
    </div>
  </div>
</div>
```

Key improvements:
- The `Percent` icon (`lucide-react`) gives the right stat a proper icon like the others
- The target control moves **under** the big `80.0%` number as a small `● Target [20] %` inline row — it reads as metadata attached to the metric, not a standalone form field
- The colored dot before "Target" communicates status at a glance without needing the word "margin" repeated twice

#### B. Progress bar cleanup

- Remove the right-side `{margin.toFixed(1)}% margin` label (duplicate of the large number above)
- Keep only the left label `"Job Cost vs Contract Value"` — or simplify to `"Margin vs Target"`
- The three values below the bar (`0%` / `20% target` / `40%+`) stay — they provide the scale context

#### C. Icon import

Add `Percent` to the lucide-react import line:
```tsx
import { TrendingUp, CheckCircle2, AlertTriangle, DollarSign, Percent } from 'lucide-react';
```

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/budget/ContractorMarginGauge.tsx` | Restructure the right stat block to use an icon-card layout. Move the target control below the margin %. Remove duplicate margin label from progress bar. |

Only one file needs to change. No props, no logic, no database changes.
