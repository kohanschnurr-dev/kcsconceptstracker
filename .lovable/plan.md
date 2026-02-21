

## Add Discreet Formula Hint Below Profit Calculator Inputs

### What's Changing

A small, subtle hint will be added just below the four input fields in the Profit Calculator, letting users know they can type `=` to use math formulas. It will be unobtrusive -- styled as faint muted text with a small calculator icon, similar to the tooltip already shown on empty inputs but as a persistent, always-visible one-liner.

### Design

- Placed directly after the input grid (after the closing `</div>` of the 4-field grid, before the results row)
- Text: `Tip: type = for inline math (e.g. =50000-12000)` 
- Styled with `text-xs text-muted-foreground/50` so it's visible but doesn't compete with the inputs or results
- Includes a tiny Calculator icon inline for visual recognition
- No interaction needed -- purely informational

### Technical Details

**`src/components/project/ProfitCalculator.tsx`** (after line 209, the end of the input grid `</div>`)

Add a single line of hint text:

```tsx
<p className="flex items-center gap-1.5 text-xs text-muted-foreground/50 -mt-3">
  <Calculator className="h-3 w-3" />
  Tip: type <span className="font-mono">=</span> for inline math (e.g. =50000-12000)
</p>
```

The `Calculator` icon is already imported. The negative top margin (`-mt-3`) tucks it closer to the inputs since the parent has `space-y-6`.

### Files Changed
- `src/components/project/ProfitCalculator.tsx` -- add one hint line after the input grid
