

## Show Tax-Inclusive Total in Split Summary

### Problem

When tax is enabled, the split breakdown shows the pre-tax subtotal (e.g. $440.28) while the actual amount logged to the budget is the tax-inclusive total (e.g. $476.60). This can confuse users into thinking their budget will show the wrong number.

### Fix

Add a helper line in the split summary footer showing the tax-inclusive total that will actually be logged, so users see both the line-item subtotal and the final amount hitting their budget.

### Changes to `src/components/QuickExpenseModal.tsx`

**Update the split summary footer (lines 559-566)** to show the tax-inclusive total when tax is enabled:

```tsx
{/* Summary footer */}
{splitMode && (
  <div className="px-3 py-2 border-t border-border bg-primary/5 space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        Splitting into <span className="font-semibold text-foreground">{uniqueSplitCategories}</span> {uniqueSplitCategories === 1 ? 'category' : 'categories'}
      </span>
      <span className="text-xs font-mono font-semibold text-primary">${splitTotal.toFixed(2)}</span>
    </div>
    {includeTax && (
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Incl. tax — amount logged to budget</span>
        <span className="text-xs font-mono font-semibold text-primary">${calculateTotal().toFixed(2)}</span>
      </div>
    )}
  </div>
)}
```

This adds a second line below the category count that only appears when tax is toggled on, showing the actual tax-inclusive total that will be recorded in the budget.

### Files Changed
- `src/components/QuickExpenseModal.tsx` -- add tax-inclusive total line to split summary footer
