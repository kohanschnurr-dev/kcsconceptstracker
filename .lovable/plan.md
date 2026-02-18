
## Contractor Project Card — Full Data & UI Overhaul

### What's Wrong Today

The contractor card currently uses the generic non-rental layout, which has two problems:

1. **Wrong progress bar**: `showBudgetProgress = !isRental && totalBudget > 0` — so any contractor project with a budget set shows a "Budget Progress" bar. For a contractor job, the meaningful progress metric is **Gross Margin %**, not budget spend %.
2. **Contract Value is invisible**: The single most important number for a contractor job (the contract value, stored as `purchasePrice`) is never shown on the card.
3. **Footer only shows Gross Profit** — no margin % context, so a $10k profit on a $20k job looks the same as $10k on a $200k job.
4. **Progress bar labels say "spent / total"** — generic flip language that doesn't match contractor context.

### What the Card Should Show

```text
┌─────────────────────────────────────────────────┐
│  [⛑] Job Name                      [active]    │
│  📍 123 Main Street                             │
├─────────────────────────────────────────────────┤
│  CONTRACT VALUE                                 │
│  $48,500             ← big, prominent           │
├─────────────────────────────────────────────────┤
│  Gross Margin                         34.2%     │
│  ████████████░░░░░░░ (color-coded bar)          │
│  $16,500 gross profit · $32,000 job cost        │
├─────────────────────────────────────────────────┤
│  Gross Profit           │  Start Date           │
│  $16,500 (green)        │  📅 Jan 15, 2025      │
└─────────────────────────────────────────────────┘
```

Color thresholds for the margin bar (matching the Budget Calculator gauge):
- Green (`bg-success`): margin ≥ 20%
- Amber (`bg-warning`): margin 10–19%
- Red (`bg-destructive`): margin < 10%

If no contract value is set, show dashes throughout (same pattern as other card types with no data).

### Technical Changes

#### 1. `src/components/dashboard/ProjectCard.tsx`

**Add contractor-specific computed values:**
```tsx
const grossMarginPct = contractorHasData && contractorCostBasis > 0
  ? (contractorGrossProfit / contractValue) * 100
  : 0;
```

**Replace `showBudgetProgress` section** — wrap it so contractor projects skip the generic bar:
```tsx
const showBudgetProgress = !isRental && !isContractor && project.totalBudget > 0;
```

**Add a contractor-specific middle section** (parallel to the rental cash-flow block):
```tsx
{isContractor && (
  <>
    {/* Contract Value highlight */}
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">Contract Value</p>
      <p className="font-mono font-semibold text-lg">
        {contractorHasData ? formatCurrency(contractValue) : '—'}
      </p>
    </div>

    {/* Gross Margin progress bar */}
    {contractorHasData && (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Gross Margin</span>
          <span className={cn('font-mono font-medium',
            grossMarginPct >= 20 ? 'text-success' :
            grossMarginPct >= 10 ? 'text-warning' : 'text-destructive'
          )}>
            {grossMarginPct.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={cn('progress-fill',
              grossMarginPct >= 20 ? 'bg-success' :
              grossMarginPct >= 10 ? 'bg-warning' : 'bg-destructive'
            )}
            style={{ width: `${Math.min(Math.max(grossMarginPct, 0), 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(contractorGrossProfit)} gross profit</span>
          <span>{formatCurrency(contractorCostBasis)} job cost</span>
        </div>
      </div>
    )}
  </>
)}
```

**Footer** — keep "Gross Profit" on the left and Start/Completed date on the right (no change needed, already correct).

### Files to Modify

| File | Change |
|---|---|
| `src/components/dashboard/ProjectCard.tsx` | 1. Add `grossMarginPct` calculation. 2. Exclude contractor from `showBudgetProgress`. 3. Add contractor middle section (Contract Value highlight + Gross Margin bar). |

One file. No DB changes needed — `purchasePrice` (contract value), `totalBudget`, and `totalSpent` are already loaded.

### Edge Cases Handled

- Contract value = 0: shows `—` everywhere, no bar renders
- Job cost > contract value (negative margin): bar renders at 0%, color is red, gross profit shows in red
- Completed project: cost basis = `totalSpent` (actual only), matching the Job P&L logic
- Active project: cost basis = `max(totalBudget, totalSpent)`, matching the Job P&L logic
- Cover photo variant: padding/layout is handled by the existing `coverPhotoUrl` wrapper — no special handling needed
