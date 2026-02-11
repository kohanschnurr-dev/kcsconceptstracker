

## Fix: "Change Category" Group Not Reflected in Budget Calculator

### Problem
When you change a category's trade group in Settings (e.g., moving Foundation from Other to Structure), the change is saved to localStorage with the correct `group` field. However, `getBudgetCalcCategories()` in `budgetCalculatorCategories.ts` ignores the stored group and always falls back to the hardcoded `CATEGORY_GROUP_MAP`, which still maps `foundation_repair` to `'other'`.

### Fix

**File: `src/lib/budgetCalculatorCategories.ts`** (1 line change)

Update line 99 in `getBudgetCalcCategories()` to prioritize the stored group from localStorage over the static map:

```typescript
// Before (always uses static map):
group: CATEGORY_GROUP_MAP[cat.value] || 'other',

// After (respects user's saved group first):
group: cat.group || CATEGORY_GROUP_MAP[cat.value] || 'other',
```

Since `getBudgetCategories()` already loads from localStorage (which includes the `group` field set by the "Change Category" action), `cat.group` will contain the user's chosen group. The static map only serves as the default for categories that haven't been reassigned.

