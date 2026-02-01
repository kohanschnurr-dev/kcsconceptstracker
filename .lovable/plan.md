
## Plan: Auto-Assign Categories to Existing Procurement Items

### Overview

Create a database update to automatically assign categories to existing procurement items based on their names, using the keyword detection logic.

---

### Items Analysis (from screenshot)

| Item Name | Detected Category | Keywords |
|-----------|------------------|----------|
| Black Mailbox | other | (no match) |
| Wood Grain Bathroom Mirror | bathroom | "bathroom", "mirror" |
| Black Bathroom Faucet | bathroom | "bathroom", "faucet" |
| Cabinet Pulls Black | hardware | "pull" |
| Cabinet Knobs Black | hardware | "knob" |
| Shower Rod | bathroom | "shower" |
| Bathroom Faucet | bathroom | "bathroom", "faucet" |
| Bathroom Light Fixture | lighting | "light", "fixture" |
| Interior Door Handles | hardware | "handle" |

---

### Technical Implementation

**1. Add "handle" keyword detection (line 448)**

Update the detectCategory function to also detect "handle" for hardware:

```tsx
if (name.includes('knob') || name.includes('pull') || name.includes('hinge') || name.includes('handle')) return 'hardware';
```

**2. Add "mailbox" keyword detection for exterior_finishes**

```tsx
if (name.includes('stucco') || name.includes('siding') || ... || name.includes('mailbox')) return 'exterior_finishes';
```

**3. Create a SQL migration to update existing items**

Run a database migration that updates `category_id` for all items based on name pattern matching:

```sql
UPDATE procurement_items
SET category_id = CASE
  WHEN LOWER(name) LIKE '%door%' THEN 'doors'
  WHEN LOWER(name) LIKE '%floor%' OR LOWER(name) LIKE '%lvp%' OR LOWER(name) LIKE '%hardwood%' THEN 'flooring'
  WHEN LOWER(name) LIKE '%faucet%' OR LOWER(name) LIKE '%toilet%' OR LOWER(name) LIKE '%sink%' THEN 'plumbing'
  WHEN LOWER(name) LIKE '%cabinet%' THEN 'cabinets'
  WHEN LOWER(name) LIKE '%knob%' OR LOWER(name) LIKE '%pull%' OR LOWER(name) LIKE '%hinge%' OR LOWER(name) LIKE '%handle%' THEN 'hardware'
  WHEN LOWER(name) LIKE '%light%' OR LOWER(name) LIKE '%fixture%' OR LOWER(name) LIKE '%chandelier%' THEN 'lighting'
  WHEN LOWER(name) LIKE '%bathroom%' OR LOWER(name) LIKE '%vanity%' OR LOWER(name) LIKE '%mirror%' OR LOWER(name) LIKE '%shower%' OR LOWER(name) LIKE '%towel%' THEN 'bathroom'
  WHEN LOWER(name) LIKE '%mailbox%' THEN 'exterior_finishes'
  ELSE 'other'
END
WHERE category_id IS NULL;
```

---

### File Changes

| File | Changes |
|------|---------|
| `src/components/procurement/ProcurementItemModal.tsx` | Add "handle" and "mailbox" keyword detection |
| Database migration | Update existing items with detected categories |

---

### Result

All existing procurement items will be assigned appropriate categories based on their names:
- Bathroom items get "bathroom"
- Cabinet hardware gets "hardware"
- Light fixtures get "lighting"
- Door-related items get "doors"
- Mailbox gets "exterior_finishes"
- Unmatched items get "other"
