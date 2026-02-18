
## Contractor Mode — Deal Parameters Upgrade

### What the user confirmed via questions:
- **Contractor-specific fields to add**: Labor Cost, Material Cost, Overhead %
- **Purchase Price**: Remove it — not needed in contractor mode
- **Square Footage**: Hide it in contractor mode
- **Margin target**: Make it user-adjustable (like MAO % in Sale mode)

---

### Overview of all changes

The contractor sidebar currently mirrors the Sale sidebar with just a label rename ("Contract Value"). We need to make it distinct and purpose-built for a contractor's workflow.

**Summary of changes:**

| Area | Change |
|---|---|
| `DealSidebar.tsx` | Hide Purchase Price + Square Footage in contractor mode. Add contractor-specific section: Labor Cost, Material Cost, Overhead % inputs |
| `BudgetCalculator.tsx` | Add `marginTarget` state + pass it to gauge. Wire overhead calculation into Job P&L. Pass labor/material split into analysis card |
| `ContractorMarginGauge.tsx` | Accept `marginTarget` prop. Show editable target % like MAO gauge. Color thresholds react to user's custom target |
| `DealSidebar` props | Add `laborCost`, `materialCost`, `overheadPct` state + handlers |

---

### Detailed Plan

#### 1. `BudgetCalculator.tsx` — New contractor state

Add four new state variables near the other deal parameters:

```tsx
const [laborCost, setLaborCost] = useState<string>('');
const [materialCost, setMaterialCost] = useState<string>('');
const [overheadPct, setOverheadPct] = useState<string>('10');
const [marginTarget, setMarginTarget] = useState<number>(20);
```

Add computed contractor values near the existing profit calculations:

```tsx
// Contractor-specific calculations
const laborCostNum = parseFloat(laborCost) || 0;
const materialCostNum = parseFloat(materialCost) || 0;
const overheadPctNum = parseFloat(overheadPct) || 0;
const overheadAmount = arvNum * (overheadPctNum / 100);
// Job cost = budget canvas total + overhead
const contractorJobCost = totalBudget + overheadAmount;
const contractorGrossProfit = arvNum - contractorJobCost;
const contractorMargin = arvNum > 0 ? (contractorGrossProfit / arvNum) * 100 : 0;
```

Pass new props to `DealSidebar`:
```tsx
laborCost={laborCost}
onLaborCostChange={setLaborCost}
materialCost={materialCost}
onMaterialCostChange={setMaterialCost}
overheadPct={overheadPct}
onOverheadPctChange={setOverheadPct}
```

Pass `marginTarget` + `onMarginTargetChange` to `ContractorMarginGauge`:
```tsx
<ContractorMarginGauge
  contractValue={arvNum}
  jobCost={contractorJobCost}
  marginTarget={marginTarget}
  onMarginTargetChange={setMarginTarget}
/>
```

Update the `getCategoryBudgetsObject` `_meta` to persist contractor fields so templates save/restore them:
```tsx
budgets._meta = {
  ...existing,
  laborCost, materialCost, overheadPct, marginTarget,
};
```

Update the contractor analysis section in the collapsible to show the full breakdown:
- **Contract** column: Contract Value, Labor Cost, Material Cost
- **Job Cost** column: Budget Canvas Total, Overhead (% of contract), Total Job Cost
- **Returns** column: Gross Profit, Gross Margin % (vs target), Labor/Material split %
- **Summary cards** (3): Contract Value | Total Job Cost | Gross Profit (colored)

---

#### 2. `DealSidebar.tsx` — Contractor-specific fields

**Update `DealSidebarProps`** to add:
```tsx
laborCost: string;
onLaborCostChange: (v: string) => void;
materialCost: string;
onMaterialCostChange: (v: string) => void;
overheadPct: string;
onOverheadPctChange: (v: string) => void;
```

**Hide Purchase Price when `calculatorType === 'contractor'`:**
```tsx
{calculatorType !== 'contractor' && (
  <div className="space-y-2">
    <Label>Purchase Price</Label>
    ...
  </div>
)}
```

**Hide Square Footage when `calculatorType === 'contractor'`:**
```tsx
{calculatorType !== 'contractor' && (
  <div className="space-y-2">
    <Label>Square Footage</Label>
    ...
  </div>
)}
```

**Add contractor fields section (shown only when `calculatorType === 'contractor'`):**

After the Contract Value input, render a new separated section:

```
─────────────────────────
  JOB BREAKDOWN          [optional live split donut preview]

  Labor Cost   [$______]
  Material Cost [$______]

  ─────────────────────────
  OVERHEAD

  Overhead %   [___%]
  = $X,XXX (computed from contract value)
```

The live overhead dollar amount is computed inline: `arvNum * (overheadPct / 100)`. This gives the contractor instant feedback on what overhead costs in real dollars.

Also show a compact **Labor / Material split bar** — a simple ratio bar showing the % breakdown of labor vs materials:

```tsx
// If labor + material > 0, show a thin horizontal bar
const total = laborCostNum + materialCostNum;
const laborPct = total > 0 ? (laborCostNum / total) * 100 : 50;
// Orange bar (labor) + remaining (material)
```

---

#### 3. `ContractorMarginGauge.tsx` — User-editable margin target

Add props:
```tsx
marginTarget: number;
onMarginTargetChange: (v: number) => void;
```

Add an inline editable target input (same UX as MAO % in MAOGauge — small `input` field inline with the label):

```tsx
<div className="flex items-center gap-1 text-xs text-muted-foreground">
  <span>Target:</span>
  <input
    type="number"
    value={marginTarget}
    onChange={(e) => onMarginTargetChange(parseFloat(e.target.value) || 20)}
    className="w-10 h-5 text-xs font-mono text-center rounded border border-input bg-background px-1"
  />
  <span>%</span>
</div>
```

Update color thresholds to be relative to `marginTarget`:
- `margin >= marginTarget` → green
- `margin >= marginTarget * 0.6` → amber  
- below → red

Update the progress bar: map `0 → marginTarget * 2` to `0 → 100%` of bar width, so the target is always at 50% of the bar visually. Add a target marker line.

---

### Files to Modify

| File | What changes |
|---|---|
| `src/pages/BudgetCalculator.tsx` | Add `laborCost`, `materialCost`, `overheadPct`, `marginTarget` state. Compute `contractorJobCost`. Pass new props to sidebar + gauge. Update contractor analysis card |
| `src/components/budget/DealSidebar.tsx` | Accept new contractor props. Hide Purchase Price + Sqft in contractor mode. Add Job Breakdown + Overhead sections for contractor only |
| `src/components/budget/ContractorMarginGauge.tsx` | Accept `marginTarget` + `onMarginTargetChange`. Make target editable inline. Update color thresholds dynamically |

No database schema changes needed.
