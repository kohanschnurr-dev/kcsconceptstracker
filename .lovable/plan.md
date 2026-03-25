

## Plan: Fix Category Click Filter + Left Clipping

### Issue 1: Clicking a category in the pie chart shows 0 results
The dropdown filter uses `cat.id` (UUID) as values, but `handleCategoryBreakdownClick` sets `selectedCategory` to `cat.category` (a string like "painting"). The filter then compares `exp.category_id === "painting"` which never matches.

**Fix in `handleCategoryBreakdownClick`**: Look up the category's `id` from the `categories` array using the `category` value, then set `selectedCategory` to that UUID.

### Issue 2: Left side of legend items clipped
The legend container has `pr-2` for scrollbar space but no left padding, so the `ring-2` highlight on selected items gets cut off by `overflow-y-auto`.

**Fix**: Add `pl-1` padding to the scrollable legend container so the ring/highlight isn't clipped.

### Changes — `src/pages/ProjectBudget.tsx`

1. **`handleCategoryBreakdownClick`** (~line 187): Find the matching category object by its `.category` field, then use its `.id` for the filter value:
   ```typescript
   const handleCategoryBreakdownClick = (categoryValue: string) => {
     const cat = categories.find(c => c.category === categoryValue);
     const filterValue = cat ? cat.id : categoryValue;
     setSelectedCategory(prev => prev === filterValue ? 'all' : filterValue);
     // ... rest stays the same
   };
   ```

2. **Legend container** (~line 973): Change `pr-2` to `px-1` to add left padding:
   ```
   <div className="flex-1 max-h-[250px] overflow-y-auto px-1">
   ```

3. **Legend row ring check** (~line 981): Update the highlight condition to compare against `cat.id` instead of `cat.category`:
   ```
   selectedCategory === cat.id && "ring-2 ring-primary bg-muted/50"
   ```

Two lines of logic change + one class tweak, all in one file.

