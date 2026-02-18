
## Two Changes: $ Icon + Dashboard Card Gross Profit Display

### Change 1 — Replace down arrow icon with $ in `ContractorFinancialsTab.tsx`

In the "Gross Profit" stat card, the icon is currently `TrendingDown` from lucide-react. The user wants it replaced with a `DollarSign` icon.

**File**: `src/components/project/ContractorFinancialsTab.tsx`

- Remove `TrendingDown` from lucide imports (or leave it if used elsewhere)
- Add `DollarSign` to lucide imports (already imported — it's used in the labor/materials inputs)
- Change the icon prop on the Gross Profit `StatCard` from `TrendingDown` to `DollarSign`

Current line:
```tsx
import { DollarSign, TrendingUp, TrendingDown, Briefcase, HardHat, AlertTriangle } from 'lucide-react';
...
<StatCard
  title="Gross Profit"
  value={formatCurrency(grossProfit)}
  subtitle={usingActuals ? 'Contract Value − Actual Costs' : 'Contract Value − Est. Job Cost'}
  icon={TrendingDown}   // ← change to DollarSign
  variant={grossProfit < 0 ? 'danger' : grossProfit > 0 ? 'success' : 'default'}
/>
```

After:
```tsx
icon={DollarSign}
```

---

### Change 2 — Show Gross Profit on the dashboard `ProjectCard` for contractor projects

The screenshot shows the dashboard card should display:
- Label: **"Gross Profit"**
- Value: **$5,000** (green if positive, red if negative)
- Sub-label: **"Contract Value − Est. Job Cost"**

This mirrors how rental projects show "Annual Cash Flow" in a highlighted box.

**File**: `src/components/dashboard/ProjectCard.tsx`

Right now contractor projects fall through to the fix-and-flip display (budget progress bar + profit/ARV logic). We need to add a contractor-specific block that:

1. Calculates `contractValue = project.purchasePrice || 0` (same as ContractorFinancialsTab)
2. Calculates `totalSpent = project.categories.reduce(...)`
3. Calculates `totalBudget = project.totalBudget`
4. Calculates `costBasis = totalBudget > 0 ? Math.max(totalBudget, totalSpent) : totalSpent`
5. `grossProfit = contractValue - costBasis`
6. `usingActuals = totalSpent > totalBudget && totalBudget > 0`

Then renders a highlighted box (matching the rental card style):
```tsx
{isContractor && (() => {
  const contractValue = project.purchasePrice || 0;
  const totalSpent = project.categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const totalBudget = project.totalBudget;
  const costBasis = totalBudget > 0 ? Math.max(totalBudget, totalSpent) : totalSpent;
  const grossProfit = contractValue - costBasis;
  const usingActuals = totalSpent > totalBudget && totalBudget > 0;
  const hasData = contractValue > 0;

  return (
    <div className="mb-4 p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">Gross Profit</p>
      <p className={cn('font-mono font-semibold text-lg', grossProfit < 0 ? 'text-destructive' : grossProfit > 0 ? 'text-success' : '')}>
        {hasData ? formatCurrency(grossProfit) : '—'}
      </p>
      {hasData && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {usingActuals ? 'Contract Value − Actual Costs' : 'Contract Value − Est. Job Cost'}
        </p>
      )}
    </div>
  );
})()}
```

This block is placed after the budget progress section (which is already hidden for contractor projects since `showBudgetProgress = !isRental && project.totalBudget > 0` — actually for contractors we also want to suppress the budget bar, so we should add `&& !isContractor` to `showBudgetProgress` as well).

**Updated `showBudgetProgress`**:
```tsx
const showBudgetProgress = !isRental && !isContractor && project.totalBudget > 0;
```

This ensures contractor cards show the Gross Profit box instead of the budget progress bar.

---

### Files to modify
- `src/components/project/ContractorFinancialsTab.tsx` — swap `TrendingDown` → `DollarSign` on the Gross Profit stat card
- `src/components/dashboard/ProjectCard.tsx` — suppress budget progress for contractors, add Gross Profit highlighted box
