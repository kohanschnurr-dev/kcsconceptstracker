

## Fix Leftover "cleaning_final_punch" Category Display

### Problem
The database contains a category value `cleaning_final_punch` (from before "Cleaning" and "Final Punch" were split into two separate categories). Since this value no longer exists in the app's category list, the label lookup fails and displays the raw database value `cleaning_final_punch` instead of a proper name.

### Solution
Add a legacy mapping in the label fallback logic so any unrecognized category value is still displayed cleanly. Two changes:

### Technical Details

**File: `src/pages/ProjectBudget.tsx`**

1. Update the `getCategoryName` function (line ~305-307) to use a human-readable fallback when the category value isn't found in the master list:

```tsx
const getCategoryName = (categoryValue: string) => {
  return getBudgetCategories().find(b => b.value === categoryValue)?.label 
    || categoryValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
```

2. Same treatment for `getCategoryLabel` (line ~299-303) -- the fallback on `cat.category` should also be formatted:

```tsx
const getCategoryLabel = (categoryId: string) => {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return 'Unknown';
  return getBudgetCategories().find(b => b.value === cat.category)?.label 
    || cat.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
```

This ensures any legacy or unrecognized category values display as properly formatted titles (e.g., "Cleaning Final Punch") rather than raw database values.

### Files Modified
- `src/pages/ProjectBudget.tsx` -- improve fallback formatting in `getCategoryLabel` and `getCategoryName`
