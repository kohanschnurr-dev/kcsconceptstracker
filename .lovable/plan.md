

## Remove "(X sqft)" from Template Names

### Problem
When selecting a baseline template, the name includes "(0 sqft)" or similar sqft suffix in the button display, which is redundant and looks cluttered.

### Change in `src/components/budget/TemplatePicker.tsx`

Update `handleBaselineSelect` (around line 119) to use just the tier name without the sqft suffix:

```
// Before:
name: `${tier.name} (${sqftNum.toLocaleString()} sqft)`,

// After:
name: tier.name,
```

This single-line change removes the "(0 sqft)" text from the template picker button for all baselines.

