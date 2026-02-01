
## Plan: Switch Countertops and Tile Icons

### Overview

Swap the icons between Countertops and Tile categories for better visual representation.

---

### Current vs. New Icons

| Category | Current Icon | New Icon |
|----------|-------------|----------|
| **Countertops** | `LayoutDashboard` | `Grid3X3` |
| **Tile** | `Grid3X3` | `LayoutDashboard` |

---

### Technical Implementation

**File: `src/components/procurement/ProcurementItemModal.tsx`**

**1. Update Countertops icon (line 143):**
```tsx
// Change from LayoutDashboard to Grid3X3
icon: Grid3X3,
```

**2. Update Tile icon (line 263):**
```tsx
// Change from Grid3X3 to LayoutDashboard
icon: LayoutDashboard,
```

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/procurement/ProcurementItemModal.tsx` | Swap icons: Countertops gets `Grid3X3`, Tile gets `LayoutDashboard` |

---

### Result

- **Countertops**: Will show `Grid3X3` icon (grid pattern representing countertop surface)
- **Tile**: Will show `LayoutDashboard` icon (layout representing tile arrangement)
