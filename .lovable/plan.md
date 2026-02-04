

## Plan: Add Reset Filters Button

### Overview
Add a "Reset" button to the Expenses table header that clears all active filters with one click for fast access.

---

### Current State
The filter bar contains:
- Search input
- Project dropdown
- Category dropdown  
- Date Range picker

Users must clear each filter individually.

---

### Solution
Add a "Reset" button that appears when any filter is active, clearing all filters at once:
- Search → empty string
- Project → "all"
- Category → "all"
- Date Range → undefined

---

### Technical Changes

**File: `src/pages/Expenses.tsx`**

1. Add a computed flag to check if any filter is active:
```typescript
const hasActiveFilters = search || projectFilter !== 'all' || categoryFilter !== 'all' || dateRange;
```

2. Add a reset function:
```typescript
const resetFilters = () => {
  setSearch('');
  setProjectFilter('all');
  setCategoryFilter('all');
  setDateRange(undefined);
};
```

3. Add Reset button after the Date Range picker (conditionally shown when filters are active):
```tsx
{hasActiveFilters && (
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={resetFilters}
    className="h-9 text-muted-foreground hover:text-foreground"
  >
    <X className="h-4 w-4 mr-1" />
    Reset
  </Button>
)}
```

---

### Visual Layout

```text
Before (filters active):
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▼ [🔍 ralph] [Wales Rental ▼] [Drain Line... ▼] [📅 Date Range] [✕ Reset]  50 expenses • $54,901 │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

After clicking Reset:
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▼ [🔍 Search...] [All Projects ▼] [All Categories ▼] [📅 Date Range]  125 expenses • $84,901 │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Expenses.tsx` | Add `hasActiveFilters` check, `resetFilters` function, and Reset button |

---

### Import Addition
Add `X` to the existing lucide-react imports (already imported for other uses in the codebase).

