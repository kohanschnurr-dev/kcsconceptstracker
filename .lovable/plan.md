

## Plan: Add Square Footage to Reset

### Overview
Update the `handleClearAll` function (triggered by the refresh button) to also clear the Square Footage field, ensuring all Deal Parameters are reset.

---

### Current Behavior
The refresh button clears:
- Purchase Price ✓
- ARV ✓
- Budget Name ✓
- Description ✓
- Category Budgets ✓
- **Square Footage ✗ (MISSING)**

---

### Change Required

**File:** `src/pages/BudgetCalculator.tsx`

| Line | Current | Updated |
|------|---------|---------|
| 142-154 | `handleClearAll` without `sqft` reset | Add `setSqft('')` to clear square footage |

---

### Code Change

```typescript
const handleClearAll = () => {
  setBudgetName('');
  setBudgetDescription('');
  setPurchasePrice('');
  setArv('');
  setSqft('');  // ADD THIS LINE
  setCurrentTemplateName('');
  
  const cleared: Record<string, string> = {};
  BUDGET_CATEGORIES.forEach(cat => {
    cleared[cat.value] = '';
  });
  setCategoryBudgets(cleared);
};
```

---

### Result
After clicking the refresh button, ALL Deal Parameters will be cleared:
- Purchase Price → empty
- ARV → empty
- Square Footage → empty
- Budget Name → empty
- Description → empty
- All category budgets → empty

