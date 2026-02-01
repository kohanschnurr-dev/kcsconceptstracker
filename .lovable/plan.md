
## Fix: Bathroom Expense Not Appearing After SmartSplit

### Root Cause

The Expenses page has a filter to prevent double-counting split transactions:

```tsx
// Lines 133-144 in Expenses.tsx
const splitQbIds = qbExpensesData
  .filter(e => e.qb_id.includes('_split_'))
  .map(e => e.qb_id.split('_split_')[0]);

const filteredQbExpenses = qbExpensesData.filter(e => {
  // If this expense's qb_id is a parent of any split records, exclude it
  if (!e.qb_id.includes('_split_') && splitQbIds.includes(e.qb_id)) {
    return false;  // ← BATHROOM IS INCORRECTLY EXCLUDED
  }
  return true;
});
```

This logic was designed for an old flow where the parent record was untouched. But SmartSplit now **updates the original record** with the first category's data (Bathroom in this case), making it a valid expense that should be displayed.

### The Split Pattern

| Record | qb_id | Amount | Category | Should Show? |
|--------|-------|--------|----------|--------------|
| Original (updated) | `purchase_769` | $206.71 | Bathroom | **YES** ← Currently hidden |
| Split 1 | `purchase_769_split_hardware` | $188.38 | Hardware | YES |
| Split 2 | `purchase_769_split_light_fixtures` | $187.79 | Light Fixtures | YES |
| Split 3 | `purchase_769_split_plumbing` | $79.01 | Plumbing | YES |
| Split 4 | `purchase_769_split_misc` | $9.71 | Misc | YES |

**All 5 records should be displayed** because the original is no longer a "parent" - it's a full expense with its own category and amount.

---

### Technical Solution

**Remove the split-filtering logic entirely.** Since SmartSplit updates the original record with valid data (amount, category, notes), there's no risk of double-counting - each record represents a distinct expense.

**File: `src/pages/Expenses.tsx`**

Remove lines 129-144 (the split filtering):

```tsx
// BEFORE: Complex filtering that incorrectly excludes first category
const splitQbIds = (qbExpensesData || [])
  .filter(e => e.qb_id.includes('_split_'))
  .map(e => e.qb_id.split('_split_')[0]);

const filteredQbExpenses = (qbExpensesData || []).filter(e => {
  if (!e.qb_id.includes('_split_') && splitQbIds.includes(e.qb_id)) {
    return false;
  }
  return true;
});

// AFTER: Use all imported QB expenses directly
const filteredQbExpenses = qbExpensesData || [];
```

**Same fix needed in:**
- `src/pages/ProjectDetail.tsx` (if similar logic exists)
- `src/pages/BusinessExpenses.tsx` (if similar logic exists)

---

### Data Flow After Fix

```text
Database contains:
  purchase_769 (Bathroom: $206.71) ✓ Shown
  purchase_769_split_hardware ($188.38) ✓ Shown
  purchase_769_split_light_fixtures ($187.79) ✓ Shown
  purchase_769_split_plumbing ($79.01) ✓ Shown
  purchase_769_split_misc ($9.71) ✓ Shown
  ─────────────────────────────────
  Total: $671.60 ✓ Matches original QB transaction
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Expenses.tsx` | Remove split-filtering logic (lines 129-144) |
| `src/pages/ProjectDetail.tsx` | Check for and remove similar filtering |
| `src/components/project/ExportReports.tsx` | Check for similar filtering in export logic |

---

### Summary

The SmartSplit design changed: the original QB record is now updated with the first category's data instead of being left empty. The filtering logic that hides "parent" records is now incorrect because those records contain valid expense data. Removing this filter will display all split expenses including the first category.
