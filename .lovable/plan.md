
## Swap "Gross Profit" and Budget Progress on Contractor Project Cards

### What the User Wants

For **Contractor** project cards only, swap two elements:

1. **Budget progress bar** — move it down to where the "Gross Profit" highlighted box currently sits (the `mb-4 p-3 rounded-lg bg-muted/50` block)
2. **Gross Profit** — move it down to the footer stats row, replacing the generic "Profit" label that currently shows `—` for contractor projects (since `hasProfit` is false when `arv = 0`)

The screenshot confirms: currently the card shows `Gross Profit` as a prominent highlighted box in the middle, and `Profit —` in the footer. The user wants `Budget` (progress) in the middle box and `Gross Profit` in the footer stat.

---

### Current Layout (Contractor card)

```
[Budget progress bar]         ← showBudgetProgress = false for contractor, so hidden
[Gross Profit box]            ← highlighted muted box, middle of card
─────────────────────────────
  Profit —   |   Start Date   ← footer, profit shows — because arv=0
```

### Target Layout (Contractor card)

```
[Budget progress bar]         ← show a contractor-specific budget bar here
─────────────────────────────
  Gross Profit $15,000  |  Start Date   ← footer shows gross profit instead
```

---

### Technical Changes — `src/components/dashboard/ProjectCard.tsx`

#### 1. Show budget progress bar for contractor projects

Currently `showBudgetProgress` is:
```tsx
const showBudgetProgress = !isRental && !isContractor && project.totalBudget > 0;
```

The budget bar is hidden for contractors. We need to show it for contractors separately — or change the condition to `!isRental && project.totalBudget > 0` and let it show for contractors too.

The cleanest approach: add a separate `showContractorBudget` flag and render the budget bar inside the contractor's `isContractor` block, **above** the footer.

Actually the simplest approach: change the `showBudgetProgress` condition to **include** contractors:
```tsx
const showBudgetProgress = !isRental && project.totalBudget > 0;
// (remove !isContractor)
```

This makes the budget progress bar appear for contractor projects automatically in its existing position.

#### 2. Remove the "Gross Profit" highlighted box for contractor

Remove the `isContractor` IIFE block (lines 185–202) that renders the highlighted `Gross Profit` box — this block becomes unnecessary since Gross Profit moves to the footer.

#### 3. Replace "Profit" with "Gross Profit" in the footer for contractor projects

In the footer grid (lines 204–219), the left column currently shows `Profit` with a value of `—` for contractors (because `hasProfit` depends on `arv > 0`).

Change the footer left column so that when `isContractor`:
- Label = `"Gross Profit"`
- Value = the calculated `grossProfit` (Contract Value − Cost Basis)

The gross profit variables (`contractValue`, `costBasis`, `grossProfit`) currently live inside the IIFE block — move them up to the top of the component body so they're accessible in both the budget bar area and the footer.

---

### Exact Code Changes

**Step A** — Hoist contractor profit variables to top of component (near other derived values):
```tsx
const contractValue = isContractor ? (project.purchasePrice || 0) : 0;
const contractorCostBasis = isContractor
  ? (project.totalBudget > 0 ? Math.max(project.totalBudget, totalSpent) : totalSpent)
  : 0;
const contractorGrossProfit = contractValue - contractorCostBasis;
const contractorHasData = isContractor && contractValue > 0;
```

**Step B** — Update `showBudgetProgress` to include contractors:
```tsx
const showBudgetProgress = !isRental && project.totalBudget > 0;
```

**Step C** — Remove the `isContractor` IIFE block (lines 185–202) entirely.

**Step D** — Update the footer left column to show Gross Profit for contractors:
```tsx
<div>
  <p className="text-xs text-muted-foreground">
    {isContractor ? 'Gross Profit' : isRental ? 'Equity Gain' : 'Profit'}
  </p>
  <p className={cn('font-mono font-semibold',
    isContractor
      ? (contractorHasData ? (contractorGrossProfit < 0 ? 'text-destructive' : 'text-success') : '')
      : (!hasProfit ? '' : profit < 0 ? 'text-destructive' : 'text-success')
  )}>
    {isContractor
      ? (contractorHasData ? formatCurrency(contractorGrossProfit) : '—')
      : (hasProfit ? formatCurrency(profit) : '—')}
  </p>
</div>
```

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/dashboard/ProjectCard.tsx` | Hoist contractor profit vars, update `showBudgetProgress`, remove Gross Profit highlighted box, update footer to show Gross Profit for contractor cards |

No database changes, no new files.
