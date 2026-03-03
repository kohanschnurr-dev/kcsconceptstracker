

## Replace Subtitles with Tooltip Icons

Remove the subtitle text under "Total All-In Costs" and "Total Construction Budget" cards that causes the height mismatch. Replace each with a small `Info` icon in the card header that shows the info on hover via a Tooltip.

**File: `src/pages/ProjectBudget.tsx`**

**Change 1 — Total All-In Costs card (lines 680-685)**

Remove the `<p>` subtitle on line 685. Add an `Info` icon next to the label that shows "Construction + Loan + Holding + Transaction" on hover via `<Tooltip>`.

```tsx
<div className="flex items-center gap-2 mb-1">
  <TrendingUp className="h-4 w-4 text-warning" />
  <span className="text-sm text-muted-foreground">Total All-In Costs</span>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent>Construction + Loan + Holding + Transaction</TooltipContent>
  </Tooltip>
</div>
<p className="text-2xl font-bold font-mono text-warning">{formatCurrency(totalSpent)}</p>
```

**Change 2 — Total Construction Budget card (lines 706-735, non-edit mode)**

Remove the `<p>` subtitle block (lines 711-735) that shows "from X categories" or "manual override (revert)". Move that info into a tooltip on an `Info` icon next to the label.

```tsx
<div className="flex items-center gap-2 mb-1">
  <DollarSign className="h-4 w-4 text-primary" />
  <span className="text-sm text-muted-foreground">Total Construction Budget</span>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent>
      {hasManualBudget ? "Manual override — click ••• to edit" : `from ${categories.length} categories`}
    </TooltipContent>
  </Tooltip>
</div>
<p className="text-2xl font-bold font-mono">{formatCurrency(totalBudget)}</p>
```

The "revert" action moves into the tooltip or remains accessible via the existing `•••` edit button — keeping the card compact.

**Imports**: Add `Info` to the lucide-react import, and ensure `Tooltip, TooltipTrigger, TooltipContent` are imported (check if `TooltipProvider` wraps the app).

Both rows will now have identical card heights: icon + label, then value. No subtitles.

