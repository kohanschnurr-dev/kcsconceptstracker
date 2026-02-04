

## Plan: Reduce Border Brightness on Budget Category Cards

### Overview
Apply reduced opacity borders (`border-border/30`) to the budget category cards and group containers to match the established table border pattern used elsewhere in the project.

---

### Current Issue
The category cards and group containers use full opacity `border` class, resulting in very bright white lines that are too prominent in dark mode.

---

### Changes Required

| File | Line | Current | Updated |
|------|------|---------|---------|
| `BudgetCategoryCard.tsx` | 28 | `border` | `border border-border/30` |
| `BudgetCategoryCard.tsx` | 29 | `border-primary/30` | `border-primary/40` (keep slightly visible when active) |
| `BudgetCanvas.tsx` | 267 | `border` | `border border-border/30` |
| `BudgetCanvas.tsx` | 268 | `border-primary/30` | `border-primary/40` |

---

### Visual Result

```text
Before: Bright white borders around each card
After:  Subtle, understated borders (30% opacity)
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/budget/BudgetCategoryCard.tsx` | Add `border-border/30` for subtle default border |
| `src/components/budget/BudgetCanvas.tsx` | Add `border-border/30` for group container border |

