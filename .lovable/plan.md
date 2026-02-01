

## Plan: Update Category Icons for Better Representation

### Overview

Update icons for Roofing, Flooring, Drywall, and Countertops to be more visually distinct and representative.

---

### Current State

| Category | Current Icon | Issue |
|----------|-------------|-------|
| Roofing | `Triangle` | User prefers `Home` icon |
| Flooring | `Layers` | Could be more specific |
| Drywall | `Grid3X3` | Same as Tile - not distinct |
| Countertops | `Grid3X3` | Same as Tile - not distinct |

---

### Proposed Icon Changes

| Category | Current | New Icon | Rationale |
|----------|---------|----------|-----------|
| **Roofing** | `Triangle` | `Home` | User preference - house silhouette represents roofing well |
| **Flooring** | `Layers` | `RectangleHorizontal` | Represents horizontal floor planks |
| **Drywall** | `Grid3X3` | `Square` | Simple wall panel shape |
| **Countertops** | `Grid3X3` | `LayoutDashboard` | Represents a countertop surface layout |

---

### Technical Implementation

**File: `src/components/procurement/ProcurementItemModal.tsx`**

**1. Update imports (add new icons):**
- Add: `Home`, `RectangleHorizontal`, `Square`, `LayoutDashboard`
- Remove: `Triangle` (no longer used)

**2. Update category definitions:**

```tsx
// Flooring (line 124): Layers → RectangleHorizontal
icon: RectangleHorizontal,

// Countertops (line 172): Grid3X3 → LayoutDashboard  
icon: LayoutDashboard,

// Roofing (line 228): Triangle → Home
icon: Home,

// Drywall (line 252): Grid3X3 → Square
icon: Square,
```

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/procurement/ProcurementItemModal.tsx` | Update 4 category icons for better visual distinction |

---

### Result

Each category will have a unique, meaningful icon:
- **Roofing**: House icon (user's preference)
- **Flooring**: Horizontal rectangle representing floor planks
- **Drywall**: Simple square representing a wall panel
- **Countertops**: Dashboard layout representing counter surface

