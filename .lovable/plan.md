

## Plan: Replace Status/Phase Filters with Sort Options

### Current State
The Procurement page has 4 filter dropdowns:
- Search input (keep)
- Bundle filter (keep)
- Status filter (remove)
- Phase filter (remove)

### Changes

**Replace the two filter dropdowns with a single "Sort By" dropdown**

| Current | New |
|---------|-----|
| All Status dropdown | Removed |
| All Phases dropdown | Replaced with "Sort By" dropdown |

### Sort Options
| Value | Label | Behavior |
|-------|-------|----------|
| `name_asc` | A-Z | Sort by item name alphabetically |
| `name_desc` | Z-A | Sort by item name reverse alphabetically |
| `price_low` | Price: Low to High | Sort by unit_price ascending |
| `price_high` | Price: High to Low | Sort by unit_price descending |

### Implementation

**File: `src/pages/Procurement.tsx`**

1. **Remove state variables:**
   - Remove `filterStatus` and `filterPhase`
   - Add `sortBy` with default value `'name_asc'`

2. **Update filter logic:**
   - Remove status and phase matching from `filteredItems`

3. **Add sorting logic:**
   - After filtering, sort items based on `sortBy` value

4. **Update UI:**
   - Remove the two filter `<Select>` components
   - Add a single "Sort By" select with the `ArrowUpDown` icon

```typescript
// State change
const [sortBy, setSortBy] = useState<string>('name_asc');

// Simplified filter (remove status/phase)
const filteredItems = items.filter(item => {
  const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.model_number?.toLowerCase().includes(searchQuery.toLowerCase());
  const bundleIds = item.bundle_ids || [];
  const matchesBundle = filterBundle === 'all' || 
    (filterBundle === 'unassigned' ? bundleIds.length === 0 : bundleIds.includes(filterBundle));
  return matchesSearch && matchesBundle;
});

// Add sorting
const sortedItems = [...filteredItems].sort((a, b) => {
  switch (sortBy) {
    case 'name_asc':
      return a.name.localeCompare(b.name);
    case 'name_desc':
      return b.name.localeCompare(a.name);
    case 'price_low':
      return a.unit_price - b.unit_price;
    case 'price_high':
      return b.unit_price - a.unit_price;
    default:
      return 0;
  }
});
```

**Updated filter row UI:**
```tsx
<div className="flex flex-col md:flex-row gap-4">
  {/* Search - keep */}
  <div className="relative flex-1">
    <Search className="..." />
    <Input ... />
  </div>
  
  {/* Bundle filter - keep */}
  <Select value={filterBundle} onValueChange={setFilterBundle}>
    ...
  </Select>
  
  {/* NEW: Sort By dropdown */}
  <Select value={sortBy} onValueChange={setSortBy}>
    <SelectTrigger className="w-full md:w-48">
      <ArrowUpDown className="h-4 w-4 mr-2" />
      <SelectValue placeholder="Sort By" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="name_asc">A-Z</SelectItem>
      <SelectItem value="name_desc">Z-A</SelectItem>
      <SelectItem value="price_low">Price: Low to High</SelectItem>
      <SelectItem value="price_high">Price: High to Low</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Summary

| Change | Details |
|--------|---------|
| Removed | `filterStatus` state and dropdown |
| Removed | `filterPhase` state and dropdown |
| Added | `sortBy` state with 4 options |
| Updated | Table now uses `sortedItems` instead of `filteredItems` |
| Import | Add `ArrowUpDown` from lucide-react |

