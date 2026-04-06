

## Plan: Auto-populate "Loan Costs" category when "Loan" cost type is selected

When a user selects "Loan" as the cost type, the category dropdown should automatically switch to `loan_costs` — saving a click for the most common pairing. The user can still change the category afterward.

### Changes

**1. `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**
- In the cost type `Select` `onValueChange`, when `"loan"` is selected, also call `setSelectedCategory('loan_costs')`

**2. `src/components/QuickExpenseModal.tsx`**
- In the cost type `Select` `onValueChange`, when `"loan"` is selected, also call `setSelectedCategory('loan_costs')`

**3. `src/components/SmartSplitReceiptUpload.tsx`**
- Same pattern: when cost type changes to `"loan"`, auto-set category to `'loan_costs'`

### Logic (same in all 3 files)
```typescript
onValueChange={(val) => {
  setCostType(val);
  if (val === 'loan') setSelectedCategory('loan_costs');
}}
```

No other files need changes. The category dropdown remains fully editable.

