
## Plan: Update Procurement Table Columns

### Overview

Modify the procurement items table to:
1. Remove the "Phase" column
2. Remove the "Color" column
3. Add a "Category" column
4. Fix column alignment - center text properly

---

### Current Table Structure

| Column | Alignment | Status |
|--------|-----------|--------|
| (image) | left | Keep |
| Item | left | Keep |
| Bundle | left | Keep |
| Source | left | Keep |
| Phase | left | **Remove** |
| Color | left | **Remove** |
| Price | right | Keep |
| Qty | right | Keep |
| Total | right | Keep |
| (actions) | - | Keep |

---

### New Table Structure

| Column | Alignment | Status |
|--------|-----------|--------|
| (image) | center | Keep |
| Item | left | Keep |
| Bundle | center | Keep |
| Source | center | Keep |
| **Category** | center | **Add** |
| Price | right | Keep |
| Qty | center | Keep |
| Total | right | Keep |
| (actions) | center | Keep |

---

### Technical Implementation

**File: `src/pages/Procurement.tsx`**

**1. Create a category lookup helper function:**
```tsx
const getCategoryLabel = (categoryId: string | null) => {
  if (!categoryId) return '-';
  // Map category_id to label from PROCUREMENT_CATEGORIES
  const categoryMap: Record<string, string> = {
    'appliances': 'Appliances',
    'bathroom': 'Bathroom',
    'cabinets': 'Cabinets',
    // ... etc
  };
  return categoryMap[categoryId] || categoryId;
};
```

**2. Update TableHeader (lines 417-429):**
- Remove Phase and Color headers
- Add Category header with center alignment
- Add text-center class to Bundle, Source, Qty columns

**3. Update TableBody cells (lines 432-526):**
- Remove Phase cell (lines 487-491)
- Remove Color cell (lines 492-498)
- Add Category cell with Badge display
- Add text-center classes to Bundle, Source, Category, Qty cells

---

### Column Alignment Changes

| Column | Current | New |
|--------|---------|-----|
| Bundle | left | center |
| Source | left | center |
| Category | n/a | center |
| Qty | right | center |

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/pages/Procurement.tsx` | Remove Phase/Color columns, add Category column, fix text alignment |

---

### Result

The table will display:
- Cleaner structure without Phase and Color columns
- New Category column showing item categories as badges
- Properly centered text in Bundle, Source, Category, and Qty columns
