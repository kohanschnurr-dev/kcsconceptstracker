
## Plan: Fix Category Display in Procurement Table

### Problem

The procurement table is showing "-" for all categories because:
1. The code reads from `category_id` (which is `null`)
2. The actual categories are stored in the new `category` column
3. The interface is missing the `category` field

### Database Verification

Current data shows categories are correctly stored:
| Item | category | category_id |
|------|----------|-------------|
| Black Shower Fixtures | bathroom | null |
| Black Mailbox | exterior_finishes | null |
| Cabinet Pulls Black | hardware | null |

---

### Technical Implementation

**File: `src/pages/Procurement.tsx`**

**1. Update ProcurementItem interface (line 40)**

Add the `category` field:

```tsx
interface ProcurementItem {
  id: string;
  bundle_id: string | null;
  bundle_ids?: string[];
  category_id: string | null;
  category: string | null;  // Add this
  name: string;
  // ... rest of fields
}
```

**2. Update getCategoryLabel mapping (lines 179-205)**

Add the new categories:

```tsx
const getCategoryLabel = (categoryId: string | null) => {
  if (!categoryId) return null;
  const categoryMap: Record<string, string> = {
    // ... existing categories ...
    'exterior_finishes': 'Exterior Finishes',  // Add
    'landscaping': 'Landscaping',              // Add
    'other': 'Other',
  };
  return categoryMap[categoryId] || categoryId;
};
```

**3. Update table display (line 516)**

Change from `category_id` to `category`:

```tsx
{getCategoryLabel(item.category) ? (
  <Badge variant="secondary" className="text-xs">
    {getCategoryLabel(item.category)}
  </Badge>
) : (
  <span className="text-muted-foreground">-</span>
)}
```

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/pages/Procurement.tsx` | Add `category` to interface, update label map with new categories, fix display to use `category` instead of `category_id` |

---

### Result

- Categories will display correctly based on what you selected when creating items
- New categories (Landscaping, Exterior Finishes) will show proper labels
- "Black Shower Fixtures" will show "Bathroom" as you selected
