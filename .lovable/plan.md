

## Plan: Fix Budget Template Total Not Updating on Save

### Problem
When saving a budget in the Budget Calculator, the `total_budget` is computed (line 415-417) but never included in the `templateData` object (line 419-426). So the `total_budget` column in the database stays stale — explaining why "Farmers Branch Flip" shows $78,000 instead of ~$130,000.

### Fix

**File: `src/pages/BudgetCalculator.tsx`** (~line 419)

Add `total_budget: totalBudget` to the `templateData` object so it gets saved on both insert and update.

```typescript
const templateData = {
  name: trimmedName,
  description: budgetDescription.trim() || null,
  purchase_price: parseFloat(purchasePrice) || 0,
  arv: parseFloat(arv) || 0,
  sqft: parseInt(sqft) || null,
  category_budgets: categoryBudgetsObj,
  total_budget: totalBudget,  // <-- add this
};
```

Single one-line addition in one file. After this fix, re-saving "Farmers Branch Flip" in the calculator will update its displayed total in the New Project dropdown.

