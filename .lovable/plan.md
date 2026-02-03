
## Plan: Move Drain Line Repair to MEPs

### Overview
Move the `drain_line_repair` category from the "Other" group to the "MEPs" group in the Budget Canvas, since drain line repair is plumbing-related work.

---

### Change Required

**File:** `src/components/budget/BudgetCanvas.tsx`

| Line | Current | Updated |
|------|---------|---------|
| 49 | `categories: ['electrical', 'plumbing', 'hvac', 'natural_gas', 'water_heater']` | `categories: ['electrical', 'plumbing', 'hvac', 'natural_gas', 'water_heater', 'drain_line_repair']` |
| 69 | `categories: ['permits_inspections', 'dumpsters_trash', 'cleaning', 'final_punch', 'staging', 'carpentry', 'pest_control', 'drain_line_repair', 'misc']` | `categories: ['permits_inspections', 'dumpsters_trash', 'cleaning', 'final_punch', 'staging', 'carpentry', 'pest_control', 'misc']` |

---

### Result

**Before:**
```text
MEPs: Electrical, Plumbing, HVAC, Gas, Water Heater
Other: Permits & Inspections, Trash Hauling, Cleaning, Final Punch, Staging, Trims, Pest Control, Drain Line Repair, Misc.
```

**After:**
```text
MEPs: Electrical, Plumbing, HVAC, Gas, Water Heater, Drain Line Repair
Other: Permits & Inspections, Trash Hauling, Cleaning, Final Punch, Staging, Trims, Pest Control, Misc.
```
