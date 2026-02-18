
## Remove Math Equation Sub-label from Contractor Dashboard Card

### What to Change

**File**: `src/components/dashboard/ProjectCard.tsx`

In the `isContractor` Gross Profit block (added in the last diff), there's a conditional block that renders the sub-label:

```tsx
{hasData && (
  <p className="text-xs text-muted-foreground mt-0.5">
    {usingActuals ? 'Contract Value − Actual Costs' : 'Contract Value − Est. Job Cost'}
  </p>
)}
```

This entire block will be removed. The card will then only show:
- "Gross Profit" label
- The dollar amount (color-coded green/red)

No other files need to change.
