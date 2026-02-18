
## Three Small UI Tweaks to the Profit Potential Table

### What the user wants (from the screenshot + message)
1. **Remove the HardHat icon** from contractor project name cells
2. **Keep the `(actual)` / `(budget)` badge** on non-contractor rows — this is already working and should stay the same
3. **Add an info tooltip `ⓘ`** to the "Construction Costs" column header that explains the logic: when `actual > budget`, actual is shown; otherwise the estimated budget is shown

---

### Changes — `src/pages/ProfitBreakdown.tsx` only

#### 1. Remove HardHat icon from the name cell (line ~382-384)

Current:
```tsx
<span className="flex items-center gap-1.5">
  {p.isContractor && <HardHat className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
  {p.name}
</span>
```

After:
```tsx
<span>{p.name}</span>
```

Also remove `HardHat` from the lucide import since it will no longer be used in JSX (check if it's used elsewhere — it's not, only in this one spot).

#### 2. Add an `ⓘ` tooltip to the "Construction Costs" column header

Import `Tooltip`, `TooltipContent`, `TooltipTrigger`, `TooltipProvider` from `@/components/ui/tooltip` and `Info` from `lucide-react`.

Change the header cell from:
```tsx
<TableHead className="text-center">Construction Costs</TableHead>
```

To:
```tsx
<TableHead className="text-center">
  <span className="inline-flex items-center gap-1 justify-center">
    Construction Costs
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs">
          Shows whichever is higher: your estimated budget or actual spending. For completed projects, actual spending is always used.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </span>
</TableHead>
```

#### 3. Keep `(actual)` / `(budget)` / `job cost` badges as-is

The existing code on lines 397-400 already shows this — no change needed here. The screenshot confirms this should stay.

---

### Files to Modify
- `src/pages/ProfitBreakdown.tsx` — remove HardHat icon from name cell, add Info tooltip to Construction Costs header
