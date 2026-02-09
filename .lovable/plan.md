
## Plan: Ensure "Garage" Appears in Category Dropdown

### Problem Analysis

After investigating, **Garage IS already included** in the `BUDGET_CATEGORIES` array in `src/types/index.ts` at line 199:

```typescript
{ value: 'garage', label: 'Garage' }
```

The issue is that the `BUDGET_CATEGORIES` array is sorted alphabetically by **value** (internal key), not by **label** (display name). This creates a confusing order in dropdowns where:

| Value Order | Label Shown |
|-------------|-------------|
| flooring | Flooring |
| food | Food |
| foundation_repair | Foundation |
| framing | Framing |
| **garage** | **Garage** |
| natural_gas | Gas |
| hardware | Hardware |

When scrolling on mobile, items can be easy to miss because the visual order doesn't match alphabetical expectations.

---

### Solution

Re-sort the `BUDGET_CATEGORIES` array so items appear in **alphabetical order by label**. This will make Garage appear between "Gas" and "Hardware" (alphabetically correct) and be easier to find.

---

### Changes

**File: `src/types/index.ts`**

Update `BUDGET_CATEGORIES` to be sorted alphabetically by label. New order:

| # | Value | Label |
|---|-------|-------|
| 1 | appliances | Appliances |
| 2 | bathroom | Bathroom |
| 3 | cabinets | Cabinets |
| 4 | cleaning | Cleaning |
| 5 | closing_costs | Closing Costs |
| 6 | driveway_concrete | Concrete |
| 7 | countertops | Countertops |
| 8 | demolition | Demolition |
| 9 | doors | Doors |
| 10 | drain_line_repair | Drain Line Repair |
| 11 | drywall | Drywall |
| 12 | electrical | Electrical |
| 13 | brick_siding_stucco | Exterior Finish |
| 14 | fencing | Fencing |
| 15 | final_punch | Final Punch |
| 16 | flooring | Flooring |
| 17 | food | Food |
| 18 | foundation_repair | Foundation |
| 19 | framing | Framing |
| 20 | **garage** | **Garage** |
| 21 | natural_gas | Gas |
| 22 | hardware | Hardware |
| 23 | hoa | HOA |
| 24 | hvac | HVAC |
| 25 | insulation | Insulation |
| 26 | insurance_project | Insurance |
| 27 | kitchen | Kitchen |
| 28 | landscaping | Landscaping |
| 29 | light_fixtures | Light Fixtures |
| 30 | main_bathroom | Main Bathroom |
| 31 | misc | Misc. |
| 32 | painting | Painting |
| 33 | permits_inspections | Permits & Inspections |
| 34 | pest_control | Pest Control |
| 35 | plumbing | Plumbing |
| 36 | pool | Pool |
| 37 | railing | Railing |
| 38 | roofing | Roofing |
| 39 | staging | Staging |
| 40 | taxes | Taxes |
| 41 | tile | Tile |
| 42 | dumpsters_trash | Trash Hauling |
| 43 | carpentry | Trims |
| 44 | utilities | Utilities |
| 45 | variable | Variable |
| 46 | water_heater | Water Heater |
| 47 | wholesale_fee | Wholesale Fee |
| 48 | windows | Windows |

---

### Implementation

Replace lines 177-226 in `src/types/index.ts` with the alphabetically sorted array:

```typescript
// Construction/Renovation categories (sorted alphabetically by label)
export const BUDGET_CATEGORIES: { value: BudgetCategory; label: string }[] = [
  { value: 'appliances', label: 'Appliances' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'cabinets', label: 'Cabinets' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'closing_costs', label: 'Closing Costs' },
  { value: 'driveway_concrete', label: 'Concrete' },
  { value: 'countertops', label: 'Countertops' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'doors', label: 'Doors' },
  { value: 'drain_line_repair', label: 'Drain Line Repair' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'brick_siding_stucco', label: 'Exterior Finish' },
  { value: 'fencing', label: 'Fencing' },
  { value: 'final_punch', label: 'Final Punch' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'food', label: 'Food' },
  { value: 'foundation_repair', label: 'Foundation' },
  { value: 'framing', label: 'Framing' },
  { value: 'garage', label: 'Garage' },
  { value: 'natural_gas', label: 'Gas' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'hoa', label: 'HOA' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'insulation', label: 'Insulation' },
  { value: 'insurance_project', label: 'Insurance' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'light_fixtures', label: 'Light Fixtures' },
  { value: 'main_bathroom', label: 'Main Bathroom' },
  { value: 'misc', label: 'Misc.' },
  { value: 'painting', label: 'Painting' },
  { value: 'permits_inspections', label: 'Permits & Inspections' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'pool', label: 'Pool' },
  { value: 'railing', label: 'Railing' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'staging', label: 'Staging' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'tile', label: 'Tile' },
  { value: 'dumpsters_trash', label: 'Trash Hauling' },
  { value: 'carpentry', label: 'Trims' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'variable', label: 'Variable' },
  { value: 'water_heater', label: 'Water Heater' },
  { value: 'wholesale_fee', label: 'Wholesale Fee' },
  { value: 'windows', label: 'Windows' },
];
```

---

### Result

After this change:

- Garage will appear in proper alphabetical position (between "Gas" and "Hardware")
- All category dropdowns across the app will display in intuitive A-Z order
- Easier to find categories on mobile without extensive scrolling
