

## Plan: Update Calendar Category Icons

### Overview
Update the icon assignments in the DealCard component to use more appropriate icons for specific categories.

---

### Icon Changes

| Category | Current Icon | New Icon | Reason |
|----------|--------------|----------|--------|
| `plumbing_rough` | Pipette (dropper) | Droplets (water) | Water emoji better represents plumbing |
| `demo` | Landmark (building) | Hammer | Demo = demolition work |
| Other structural/exterior (`foundation_piers`, `roofing`, `garage`, `grading`, `siding`, `windows`, `exterior_paint`) | Landmark | Home (house) | House icon for building exterior work |

---

### Technical Changes

**File: `src/components/calendar/DealCard.tsx`**

1. Update imports:
   - Remove: `Landmark`
   - Add: `Droplets`
   - Keep: `Home` (already imported), `Hammer` (already imported)

2. Update `getCategoryIcon` function:

```typescript
case 'structural_exterior':
  switch (category) {
    case 'demo': return <Hammer className={iconClass} />;
    default: return <Home className={iconClass} />;  // House for all other exterior
  }
case 'rough_ins':
  switch (category) {
    case 'plumbing_rough': return <Droplets className={iconClass} />;  // Water icon
    case 'electrical_rough': return <Zap className={iconClass} />;
    case 'hvac_rough': return <Fan className={iconClass} />;
    case 'framing': return <Hammer className={iconClass} />;
    default: return <Wrench className={iconClass} />;
  }
```

---

### Visual Result

| Category | Icon Display |
|----------|--------------|
| Demo | 🔨 Hammer |
| Foundation/Piers | 🏠 House |
| Roofing | 🏠 House |
| Garage | 🏠 House |
| Grading | 🏠 House |
| Siding | 🏠 House |
| Windows | 🏠 House |
| Exterior Paint | 🏠 House |
| Plumbing (Cast Iron/PVC) | 💧 Droplets |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/calendar/DealCard.tsx` | Update imports (remove Landmark, add Droplets), modify getCategoryIcon switch logic |

