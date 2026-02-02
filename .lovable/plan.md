

## Plan: Move Expand/Collapse All Button to Top Left

### Overview

Move the "Expand All / Collapse All" toggle button from the top-right to the top-left of the budget category grid.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/budget/BudgetCanvas.tsx` | Change `justify-end` to `justify-start` on line 77 |

---

### Technical Details

**File: `src/components/budget/BudgetCanvas.tsx`**

Change the flex container alignment from right to left:

```tsx
// Before (line 77)
<div className="flex justify-end mb-2">

// After
<div className="flex justify-start mb-2">
```

---

### Visual Result

```text
Before:                                    After:
                     [↕ Expand All]        [↕ Expand All]
┌──────────────┐  ┌──────────────┐        ┌──────────────┐  ┌──────────────┐
│ Structure    │  │ MEPs         │        │ Structure    │  │ MEPs         │
└──────────────┘  └──────────────┘        └──────────────┘  └──────────────┘
```

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/budget/BudgetCanvas.tsx` | 77 | Change `justify-end` → `justify-start` |

