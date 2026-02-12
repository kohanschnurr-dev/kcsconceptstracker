

## Show Empty Custom Trade Groups in Budget Calculator

### Problem
When you create a new trade group like "Purchase & Sale" in Settings, it doesn't appear in the Budget Calculator canvas because the code filters out groups with zero categories assigned.

### Solution
Modify `buildBudgetCalcGroups` in `src/lib/budgetCalculatorCategories.ts` to always include **custom** groups (even if empty), while still hiding empty **built-in** groups. This way, newly created groups immediately appear in the canvas so you can see them and assign categories to them.

### Technical Details

**File: `src/lib/budgetCalculatorCategories.ts` (lines 141-157)**

Update `buildBudgetCalcGroups` to keep custom groups even when they have no categories:

```typescript
export function buildBudgetCalcGroups(categories: CategoryItem[]) {
  const allDefs = getAllGroupDefs();
  const customDefs = loadCustomGroups();
  const groupOrder = Object.keys(allDefs);
  return groupOrder
    .map(groupKey => {
      const def = allDefs[groupKey];
      const cats = categories.filter(c => c.group === groupKey);
      return {
        key: groupKey,
        name: def.label,
        icon: def.icon,
        emoji: def.emoji,
        categories: cats.map(c => c.value),
      };
    })
    .filter(g => g.categories.length > 0 || g.key in customDefs);
}
```

**File: `src/components/budget/BudgetCanvas.tsx`**

Add an empty-state message inside empty custom groups so they don't look broken:

```
No categories assigned yet. Go to Settings > Expense Categories to assign categories to this group.
```

### Files Modified
- `src/lib/budgetCalculatorCategories.ts` -- keep custom groups visible even when empty
- `src/components/budget/BudgetCanvas.tsx` -- empty-state hint for groups with no categories
