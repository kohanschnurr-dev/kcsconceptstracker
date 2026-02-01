
## Plan: Simplify Procurement Summary Cards

### Overview

Remove the "In Cart" and "Ordered" summary cards from the Procurement page, keeping only "Total Items" and "Bundles".

---

### Current Layout (4 cards)

| Total Items | In Cart | Ordered | Bundles |
|-------------|---------|---------|---------|
| 16 | $0.00 | $0.00 | 2 |

### New Layout (2 cards)

| Total Items | Bundles |
|-------------|---------|
| 16 | 2 |

---

### Technical Implementation

**File: `src/pages/Procurement.tsx`**

**1. Remove unused calculations (lines ~217-224)**

Remove these variables that are no longer needed:
```tsx
const cartTotal = filteredItems
  .filter(i => (i.status || 'researching') === 'in_cart')
  .reduce((sum, i) => sum + calculateItemTotal(i), 0);

const orderedTotal = filteredItems
  .filter(i => (i.status || 'researching') === 'ordered')
  .reduce((sum, i) => sum + calculateItemTotal(i), 0);
```

**2. Update grid layout (line ~274)**

Change from 4 columns to 2:
```tsx
<div className="grid grid-cols-2 gap-4">
```

**3. Remove In Cart and Ordered cards (lines ~284-306)**

Remove these two card components, keeping only Total Items and Bundles.

---

### Changes Summary

| Location | Change |
|----------|--------|
| Lines 217-224 | Remove cartTotal and orderedTotal calculations |
| Line 274 | Change grid from `grid-cols-2 lg:grid-cols-4` to `grid-cols-2` |
| Lines 284-306 | Remove In Cart and Ordered card components |

---

### Result

- Cleaner summary section with just 2 cards
- Total Items and Bundles displayed side by side
- Removed unused status-based calculations
