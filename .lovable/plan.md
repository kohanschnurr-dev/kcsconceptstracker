

## Plan: Add Expand/Collapse All Button for Budget Category Groups

### Overview

Add a quick toggle button above the category groups that allows users to expand or collapse all 6 groups at once, instead of clicking each one individually.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/budget/BudgetCanvas.tsx` | Add expand/collapse all button with toggle state logic |

---

### Technical Details

**File: `src/components/budget/BudgetCanvas.tsx`**

**1. Add helper to determine current state:**
```typescript
const allGroupNames = CATEGORY_GROUPS.map(g => g.name);
const allExpanded = allGroupNames.every(name => openGroups.includes(name));
const allCollapsed = openGroups.length === 0;
```

**2. Add toggle all function:**
```typescript
const toggleAll = () => {
  if (allExpanded) {
    setOpenGroups([]); // Collapse all
  } else {
    setOpenGroups(allGroupNames); // Expand all
  }
};
```

**3. Add button above the grid:**
```tsx
<div className="flex justify-end mb-2">
  <button
    onClick={toggleAll}
    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
  >
    {allExpanded ? (
      <>
        <ChevronsDownUp className="h-3.5 w-3.5" />
        Collapse All
      </>
    ) : (
      <>
        <ChevronsUpDown className="h-3.5 w-3.5" />
        Expand All
      </>
    )}
  </button>
</div>
```

**4. Add new icon imports:**
```typescript
import { ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
```

---

### UI Layout

```text
                                    [↕ Expand All]  ← New button (right-aligned)
┌───────────────────────────┐  ┌───────────────────────────┐
│ > 🏠 Structure       $0   │  │ > ⚡ MEPs            $0   │
└───────────────────────────┘  └───────────────────────────┘
┌───────────────────────────┐  ┌───────────────────────────┐
│ > 🎨 Finishes        $0   │  │ > 💧 Kitchen & Bath  $0   │
└───────────────────────────┘  └───────────────────────────┘
┌───────────────────────────┐  ┌───────────────────────────┐
│ > 🌳 Exterior        $0   │  │ > 📦 Other           $0   │
└───────────────────────────┘  └───────────────────────────┘
```

After clicking "Expand All":
```text
                                    [↕ Collapse All]  ← Text changes
┌───────────────────────────┐  ┌───────────────────────────┐
│ ∨ 🏠 Structure       $0   │  │ ∨ ⚡ MEPs            $0   │
│  [Demolition] [Framing]   │  │  [Electrical] [Plumbing]  │
│  [Foundation] ...         │  │  [HVAC] ...               │
└───────────────────────────┘  └───────────────────────────┘
...
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/budget/BudgetCanvas.tsx` | Add expand/collapse all button, toggle logic, and new icon imports |

