

## Plan: Add Category Filter to Procurement Page

### Overview

Add a category filter dropdown next to the existing Bundle filter and Sort dropdown, allowing users to filter procurement items by category (Bathroom, Tile, Hardware, etc.).

---

### Changes Summary

| File | Change |
|------|--------|
| `src/pages/Procurement.tsx` | Add `filterCategory` state, category filter dropdown, and update filtering logic |

---

### Technical Details

**File: `src/pages/Procurement.tsx`**

**1. Add new state for category filter (around line 113):**

```typescript
const [filterCategory, setFilterCategory] = useState<string>('all');
```

**2. Extract unique categories from items for the dropdown:**

```typescript
const uniqueCategories = [...new Set(items.map(i => i.category).filter(Boolean))]
  .sort((a, b) => (getCategoryLabel(a) || '').localeCompare(getCategoryLabel(b) || ''));
```

**3. Update filtering logic (lines 216-224) to include category:**

```typescript
const filteredItems = items.filter(item => {
  const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.model_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
  const bundleIds = item.bundle_ids || [];
  const matchesBundle = filterBundle === 'all' || 
    (filterBundle === 'unassigned' ? bundleIds.length === 0 : bundleIds.includes(filterBundle));
  const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
  return matchesSearch && matchesBundle && matchesCategory;
});
```

**4. Add category filter dropdown between Bundle filter and Sort (after line 381):**

```tsx
<Select value={filterCategory} onValueChange={setFilterCategory}>
  <SelectTrigger className="w-full md:w-48">
    <Package className="h-4 w-4 mr-2" />
    <SelectValue placeholder="All Categories" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Categories</SelectItem>
    {uniqueCategories.map(cat => (
      <SelectItem key={cat} value={cat!}>{getCategoryLabel(cat)}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

### Visual Result

```text
Before:
┌─────────────────────────────┐ ┌──────────────┐ ┌──────────┐
│ 🔍 Search items...          │ │ All Bundles ▼│ │ A-Z     ▼│
└─────────────────────────────┘ └──────────────┘ └──────────┘

After:
┌─────────────────────────────┐ ┌──────────────┐ ┌────────────────┐ ┌──────────┐
│ 🔍 Search items...          │ │ All Bundles ▼│ │ All Categories▼│ │ A-Z     ▼│
└─────────────────────────────┘ └──────────────┘ └────────────────┘ └──────────┘
```

---

### Category Options

The dropdown will include all categories that have at least one item, sorted alphabetically:
- All Categories (default)
- Appliances
- Bathroom
- Cabinets
- Countertops
- Doors
- Electrical
- Exterior Finishes
- Flooring
- Hardware
- HVAC
- Light Fixtures
- Paint
- Plumbing
- Tile
- Trim
- Windows
- Other
- (etc. - only shows categories with items)

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/pages/Procurement.tsx` | 113, 216-224, 381 | Add state, update filter logic, add dropdown |

