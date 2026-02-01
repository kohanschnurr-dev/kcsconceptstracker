

## Plan: Fix Parent Transaction Totals Being Double-Counted

### Problem Confirmed

Two separate data issues causing incorrect totals:

**Issue 1: `purchase_801` (Jan 28 Home Depot) - $221.34 shown, should be ~$111.48**
- All 4 records correctly have `_split_` suffix
- **BUT** the first split (`purchase_801_split_framing`) was saved with the full original amount ($111.48) instead of its proportional share
- The amounts in database:
  - `purchase_801_split_framing`: $111.48 (should be ~$56.11)
  - `purchase_801_split_drywall`: $29.63 (should be ~$14.92)
  - `purchase_801_split_hardware`: $10.79 (should be ~$5.43)
  - `purchase_801_split_painting`: $69.44 (should be ~$34.95)
- This was imported BEFORE the proportional scaling fix was applied

**Issue 2: `purchase_769` (Jan 19 Amazon) - $1,136.49 shown, should be ~$671.60**
- **Parent record still exists without `_split_` suffix** - this is the bug
- Records in database:
  - `purchase_769`: $671.60 (parent - should NOT exist or should have `_split_` suffix)
  - `purchase_769_split_hardware`: $188.38
  - `purchase_769_split_kitchen`: $79.01
  - `purchase_769_split_light_fixtures`: $187.79
  - `purchase_769_split_misc`: $9.71
- The parent $671.60 is being added to all splits = $1,136.49

### Root Cause

These are **legacy data issues** from before the fixes were applied:
1. The proportional scaling fix (line 573) was only applied after these transactions were imported
2. The `_split_` suffix for the first category (line 611) was only added in the latest fix

### Solution: Two-Part Fix

---

### Part 1: Fix `purchase_769` (Amazon) - Rename Parent Record

The parent record `purchase_769` should have a `_split_` suffix like all other splits.

```sql
-- Rename the parent record to include _split_ suffix
UPDATE quickbooks_expenses 
SET qb_id = 'purchase_769_split_plumbing'
WHERE qb_id = 'purchase_769';
```

After this fix, all 5 Amazon records will have `_split_` suffixes and the parent-exclusion logic will correctly show them as individual items.

---

### Part 2: Fix `purchase_801` (Home Depot) - Scale Amounts Proportionally

The amounts need to be scaled down to match the original QB transaction ($111.48).

Current total: $221.34
Target total: $111.48
Scale factor: 111.48 / 221.34 = 0.5036

```sql
-- Scale all purchase_801 splits to proportionally match original total
UPDATE quickbooks_expenses 
SET amount = ROUND(amount * (111.48 / 221.34), 2)
WHERE qb_id LIKE 'purchase_801_split_%';
```

**After scaling:**
| Category | Current | Corrected |
|----------|---------|-----------|
| Framing | $111.48 | $56.14 |
| Painting | $69.44 | $34.97 |
| Drywall | $29.63 | $14.92 |
| Hardware | $10.79 | $5.43 |
| **Total** | $221.34 | **$111.46** |

---

### Part 3: Add UI Protection (Defensive Code)

Update the grouping logic in `Expenses.tsx` to **exclude parent records** when splits exist. This protects against any future data issues:

**File: `src/pages/Expenses.tsx`**

Add logic after grouping to filter out parent records if child splits exist:

```typescript
// After grouping, filter out any parent records that have child splits
// This prevents double-counting if a parent record wasn't renamed correctly
const filteredGroups = Array.from(groups.entries()).map(([parentId, groupExpenses]) => {
  if (groupExpenses.length > 1) {
    // Multiple expenses in group - filter out any that don't have _split_ in qb_id
    // (these would be duplicate parent records)
    const filtered = groupExpenses.filter(e => 
      !e.qb_id || e.qb_id.includes('_split_')
    );
    return filtered.length > 0 ? filtered : groupExpenses;
  }
  return groupExpenses;
});
```

---

### Summary

| Change | Purpose |
|--------|---------|
| SQL: Rename `purchase_769` to `purchase_769_split_plumbing` | Fix Amazon parent record showing twice |
| SQL: Scale `purchase_801_split_*` amounts by 0.5036 | Fix Home Depot amounts to match original total |
| Code: Add parent-exclusion filter in grouping | Prevent future double-counting issues |

### Result After Fix

- Jan 28 Home Depot: $111.46 (was $221.34)
- Jan 19 Amazon: Will show 5 separate category items totaling original QB amount (was double-counted at $1,136.49)

