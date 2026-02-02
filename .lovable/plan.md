

## Plan: Remove Icons from Individual Category Cards

### Problem

Currently, only some category cards have icons (Demolition, Framing, Electrical, etc.) while others don't. This creates visual inconsistency. The user wants a standardized look by removing all icons from the individual category items, while keeping the icons in the main group headers (Structure, MEPs, Finishes, etc.).

---

### Changes Required

**File: `src/components/budget/BudgetCanvas.tsx`**

1. Remove the `CATEGORY_ICONS` mapping object (lines 51-63)
2. Remove the icon prop from the `BudgetCategoryCard` component call (line 144)
3. Clean up unused icon imports (Hammer, Wrench, Grid3X3, Fence, FileCheck)

| Current | New |
|---------|-----|
| Some categories have icons, some don't | No categories have icons |
| Group headers keep their icons | Group headers keep their icons (unchanged) |

---

### Visual Result

```text
BEFORE (inconsistent):
> Structure ($0)
  [Hammer] Demolition    [House] Framing    Foundation
  Roofing                Drywall            Insulation

AFTER (consistent):
> Structure ($0)
  Demolition    Framing    Foundation
  Roofing       Drywall    Insulation
```

The main group headers (Structure, MEPs, Finishes, etc.) will retain their icons since those are consistently applied to all headers.

---

### Files to Modify

| File | Action |
|------|--------|
| `src/components/budget/BudgetCanvas.tsx` | Remove `CATEGORY_ICONS` object and stop passing icon prop to cards |

