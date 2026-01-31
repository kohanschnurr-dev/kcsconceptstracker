

## Fix: Change "Lighting" to "Light Fixtures" for Category Consistency

### Problem
The SmartSplit category dropdown shows "Lighting" but the expense categories use "Light Fixtures" (`light_fixtures`). This mismatch means:
- Items categorized as "lighting" by the parser won't match the actual budget category
- Users see inconsistent naming between SmartSplit and the rest of the app

### Root Cause

Two places use the incorrect "lighting" instead of "light_fixtures":

| Location | Current | Should Be |
|----------|---------|-----------|
| `SmartSplitReceiptUpload.tsx` line 129 | `'lighting'` | `'light_fixtures'` |
| `parse-receipt-image/index.ts` line 148 | `lighting` | `light_fixtures` |

### Solution

Update both files to use `light_fixtures` to match `BUDGET_CATEGORIES`:

---

### Implementation

**File 1:** `src/components/SmartSplitReceiptUpload.tsx`

Replace the hardcoded `categoryOptions` array (lines 126-131) with one that uses `BUDGET_CATEGORIES` from types, ensuring consistency:

```typescript
// Category options for the dropdown (sorted A-Z) - using BUDGET_CATEGORIES values
const categoryOptions = BUDGET_CATEGORIES
  .map(c => c.value)
  .filter(v => [
    'appliances', 'bathroom', 'cabinets', 'carpentry', 'countertops',
    'demolition', 'doors', 'drywall', 'electrical', 'flooring',
    'hardware', 'hvac', 'kitchen', 'landscaping', 'light_fixtures',
    'misc', 'painting', 'plumbing', 'roofing', 'windows'
  ].includes(v))
  .sort();
```

Also update the `capitalize` function to use the proper label from `BUDGET_CATEGORIES`:

```typescript
const getCategoryLabel = (category: string) => {
  const found = BUDGET_CATEGORIES.find(c => c.value === category);
  return found?.label || category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
};
```

Update the SelectValue display (line 819) to use this helper for proper labeling.

---

**File 2:** `supabase/functions/parse-receipt-image/index.ts`

Update the CATEGORIES list in the system prompt (line 147-148) to use `light_fixtures`:

```text
CATEGORIES:
plumbing, electrical, hvac, flooring, painting, cabinets, countertops, tile, light_fixtures, hardware, appliances, windows, doors, roofing, framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, misc
```

---

### Visual Change

| Before | After |
|--------|-------|
| Lighting | Light Fixtures |

The dropdown will now show "Light Fixtures" matching the expense categories throughout the app.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/SmartSplitReceiptUpload.tsx` | Replace `'lighting'` with `'light_fixtures'` in categoryOptions, add label helper |
| `supabase/functions/parse-receipt-image/index.ts` | Replace `lighting` with `light_fixtures` in CATEGORIES prompt |

---

### Expected Results

- SmartSplit dropdown shows "Light Fixtures" instead of "Lighting"
- AI parser suggests `light_fixtures` category for lighting items
- Categories match between SmartSplit, Project Budget, and Expenses pages
- Split imports correctly assign items to the Light Fixtures budget category

