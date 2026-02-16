

## Show Both LTV Base Options as Segmented Toggle

### Change
Replace the single toggle button (showing only the current mode) with a two-option segmented control that displays both "ARV" and "PP" side by side, with the active option highlighted. This matches the pattern already used for the Points toggle.

### Technical Details

**File: `src/components/budget/RentalFields.tsx`** (lines ~163-172)

Replace the single `<button>` toggle with two adjacent buttons styled as a segmented control:

```tsx
<div className="flex items-center gap-1.5">
  <Label className="text-xs">Loan-to-{values.refiLtvBase === 'purchase' ? 'Purchase' : 'Value'}</Label>
  <div className="flex rounded border border-input overflow-hidden">
    <button
      type="button"
      className={`text-[10px] font-mono font-medium px-1.5 py-0.5 transition-colors ${
        values.refiLtvBase === 'arv' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
      }`}
      onClick={() => onChange('refiLtvBase', 'arv')}
    >
      ARV
    </button>
    <button
      type="button"
      className={`text-[10px] font-mono font-medium px-1.5 py-0.5 transition-colors ${
        values.refiLtvBase === 'purchase' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
      }`}
      onClick={() => onChange('refiLtvBase', 'purchase')}
    >
      PP
    </button>
  </div>
</div>
```

The active option gets `bg-primary text-primary-foreground` styling while the inactive option stays muted. The label still dynamically reads "Loan-to-Value" or "Loan-to-Purchase" based on selection.

No other files need changes.
