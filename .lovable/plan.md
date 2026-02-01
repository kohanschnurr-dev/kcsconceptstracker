
## Plan: Update Icons for Appliances, Windows, and Roofing

### Overview

Replace the generic `Home` icon used for Appliances, Windows, and Roofing categories with more representative icons that clearly communicate what each category represents.

---

### Current Issue

In `src/components/procurement/ProcurementItemModal.tsx`, three categories currently use the generic `Home` icon:
- **Appliances** (line 200): `icon: Home` - should represent kitchen/home appliances
- **Windows** (line 208): `icon: Home` - should represent a window frame
- **Roofing** (line 224): `icon: Home` - should represent a roof/rooftop

---

### Proposed Icon Changes

| Category | Current Icon | New Icon | Rationale |
|----------|-------------|----------|-----------|
| Appliances | `Home` | `Refrigerator` | Refrigerator is a universally recognized appliance icon |
| Windows | `Home` | `AppWindow` | A framed rectangle that resembles a window pane |
| Roofing | `Home` | `Triangle` | A simple triangle shape resembles a roof profile |

---

### Technical Implementation

**File: `src/components/procurement/ProcurementItemModal.tsx`**

**1. Update imports (lines 12-36):**
- Add: `Refrigerator`, `AppWindow`, `Triangle`
- Remove: `Home` (if no longer used elsewhere)

**2. Update Appliances category (lines 197-204):**
```tsx
// BEFORE:
icon: Home,

// AFTER:
icon: Refrigerator,
```

**3. Update Windows category (lines 205-212):**
```tsx
// BEFORE:
icon: Home,

// AFTER:
icon: AppWindow,
```

**4. Update Roofing category (lines 221-228):**
```tsx
// BEFORE:
icon: Home,

// AFTER:
icon: Triangle,
```

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/procurement/ProcurementItemModal.tsx` | Replace `Home` icon with `Refrigerator`, `AppWindow`, and `Triangle` for the respective categories |

---

### Result

Each category will have a distinct, meaningful icon:
- Appliances: A refrigerator icon that clearly represents home appliances
- Windows: A window-frame style icon that represents glass panes
- Roofing: A triangular roof shape icon representing rooftops/shingles

