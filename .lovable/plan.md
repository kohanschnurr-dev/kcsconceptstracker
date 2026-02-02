

## Plan: Rename "Carpentry" Label to "Trims"

### Overview

Change the display label from "Carpentry (Trim, Baseboards, etc.)" to simply "Trims" across the application. The internal value `carpentry` will remain unchanged to avoid database migration issues.

---

### Changes Required

**File: `src/types/index.ts`**

Update the label in the `BUDGET_CATEGORIES` array:

| Current | New |
|---------|-----|
| `{ value: 'carpentry', label: 'Carpentry (Trim, Baseboards, etc.)' }` | `{ value: 'carpentry', label: 'Trims' }` |

This single change will propagate to all UI elements that display this category because:
- Budget Calculator category cards use `BUDGET_CATEGORIES` for labels
- Expense dropdowns reference `BUDGET_CATEGORIES`
- Vendor trade selections reference this array
- All other category displays derive from this source of truth

---

### No Changes Needed

| Location | Reason |
|----------|--------|
| `src/components/budget/BudgetCanvas.tsx` | Uses the value `carpentry` which stays the same |
| `src/components/SmartSplitReceiptUpload.tsx` | Uses the value `carpentry` which stays the same |
| `supabase/functions/parse-receipt-image/index.ts` | Uses the value `carpentry` for AI parsing (internal) |
| `src/integrations/supabase/types.ts` | Auto-generated from database, uses value not label |
| Database | The `carpentry` value in existing records remains valid |

---

### Result

- All UI displays will show "Trims" instead of "Carpentry (Trim, Baseboards, etc.)"
- Existing database records with `carpentry` continue to work
- No database migration required
- Alphabetical sorting in dropdowns will place it under "T" instead of "C"

