

## Plan: Organize Categories A-Z with Other Last

### Overview

Reorder the `PROCUREMENT_CATEGORIES` array so categories appear in alphabetical order (A-Z), with "Other" always positioned last.

---

### Current vs. New Order

| Current Position | Category | New Position |
|-----------------|----------|--------------|
| 1 | Doors | 5 |
| 2 | Flooring | 9 |
| 3 | Plumbing | 16 |
| 4 | Electrical | 7 |
| 5 | HVAC | 12 |
| 6 | Paint | 15 |
| 7 | Cabinets | 3 |
| 8 | Countertops | 4 |
| 9 | Tile | 19 |
| 10 | Lighting | 14 |
| 11 | Hardware | 11 |
| 12 | Appliances | 1 |
| 13 | Windows | 21 |
| 14 | Fencing | 8 |
| 15 | Roofing | 18 |
| 16 | Framing | 10 |
| 17 | Insulation | 13 |
| 18 | Drywall | 6 |
| 19 | Bathroom | 2 |
| 20 | Trim | 20 |
| 21 | Pool | 17 |
| 22 | Other | 22 (last) |

---

### New Alphabetical Order

1. Appliances
2. Bathroom
3. Cabinets
4. Countertops
5. Doors
6. Drywall
7. Electrical
8. Fencing
9. Flooring
10. Framing
11. Hardware
12. HVAC
13. Insulation
14. Lighting
15. Paint
16. Plumbing
17. Pool
18. Roofing
19. Tile
20. Trim
21. Windows
22. **Other** (always last)

---

### Technical Implementation

**File: `src/components/procurement/ProcurementItemModal.tsx`**

Reorder the `PROCUREMENT_CATEGORIES` array (lines 115-291) to follow alphabetical order with Other at the end. The category objects themselves remain unchanged - only their position in the array changes.

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/procurement/ProcurementItemModal.tsx` | Reorder `PROCUREMENT_CATEGORIES` array alphabetically (A-Z), with "Other" last |

---

### Result

The category selection grid will display categories in a predictable, easy-to-scan alphabetical order, making it faster for users to find the category they need.

