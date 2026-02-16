

## Show Profit Instead of Expenses on Rental Project Cards

### Change
In the bottom stats grid of rental project cards, replace the "Expenses" label and total spent value with "Profit" using the same profit formula already calculated in the component.

### Technical Details

**File: `src/components/dashboard/ProjectCard.tsx`**

In the bottom grid (around lines 155-161), the `else` branch for rental cards currently shows:

```tsx
<div>
  <p className="text-xs text-muted-foreground">Expenses</p>
  <p className="font-mono font-semibold">{formatCurrency(totalSpent)}</p>
</div>
```

Replace with:

```tsx
<div>
  <p className="text-xs text-muted-foreground">Profit</p>
  <p className={cn('font-mono font-semibold', !hasProfit ? '' : profit < 0 ? 'text-destructive' : 'text-success')}>
    {hasProfit ? formatCurrency(profit) : '—'}
  </p>
</div>
```

This reuses the existing `profit`, `hasProfit`, and color logic already computed at the top of the component. No new calculations needed.
