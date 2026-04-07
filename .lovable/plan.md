

## Auto-select "Utilities" When "Monthly" Cost Type Is Chosen

### Change

**File: `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**

In the cost type `onValueChange` handler (line 240-243), add a case for `monthly` that auto-sets the category to `utilities`, mirroring the existing pattern for `loan` → `loan_costs`:

```typescript
onValueChange={(val) => {
  setSelectedCostType(val);
  if (val === 'loan') setSelectedCategory('loan_costs');
  if (val === 'monthly') setSelectedCategory('utilities');
}}
```

The category dropdown remains fully interactive, so the user can still change it after the auto-selection. One file, one line added.

