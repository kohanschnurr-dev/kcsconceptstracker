

## Plan: Fix SmartSplit Parent Record Detection Logic

### Problem Identified

The SmartSplit system updates the original QuickBooks record (`purchase_802`) with the first category's data (Framing), but the parent-exclusion logic in `ProjectBudget.tsx` and `Expenses.tsx` then incorrectly **hides** this record because it sees splits like `purchase_802_split_demolition` exist.

**Current behavior:**
- `purchase_802` = Framing ($119.81) - **EXCLUDED** as "parent"
- `purchase_802_split_demolition` = Demolition ($32.44) - Shown
- `purchase_802_split_drywall` = Drywall ($31.60) - Shown  
- `purchase_802_split_hardware` = Hardware ($27.57) - Shown

**Expected behavior:**
- All four should be shown (they represent different categories)

### Root Cause

The filtering logic assumes that if `_split_` records exist, the original parent record is a duplicate that should be hidden. But SmartSplit actually **repurposes** the parent as the first category's expense, so it should NOT be excluded.

### Solution

Update the SmartSplit naming convention so the first category also gets a `_split_` suffix. This makes all split records follow the same pattern and prevents the original record from being incorrectly hidden.

**New naming pattern after SmartSplit:**
- `purchase_802_split_framing` = Framing ($119.81)
- `purchase_802_split_demolition` = Demolition ($32.44)
- `purchase_802_split_drywall` = Drywall ($31.60)
- `purchase_802_split_hardware` = Hardware ($27.57)

### Technical Changes

**File: `src/components/SmartSplitReceiptUpload.tsx`**

Modify the SmartSplit logic so the first category also updates the `qb_id` to include the `_split_{category}` suffix:

| Location | Change |
|----------|--------|
| Lines 609-645 | Update the first category's `qb_id` to `{originalQbId}_split_{category}` instead of keeping the original ID |

**Before (first category):**
```typescript
if (i === 0) {
  // Updates original record, keeps qb_id as "purchase_802"
  await supabase
    .from('quickbooks_expenses')
    .update({ 
      is_imported: true,
      amount: categoryAmount,
      // ... other fields
    })
    .eq('id', originalQbExpenseId);
}
```

**After (first category):**
```typescript
if (i === 0) {
  // Updates original record AND renames qb_id to include split suffix
  const splitQbId = `${originalQbId}_split_${category}`;
  await supabase
    .from('quickbooks_expenses')
    .update({ 
      qb_id: splitQbId,  // Add split suffix to first category too
      is_imported: true,
      amount: categoryAmount,
      // ... other fields
    })
    .eq('id', originalQbExpenseId);
}
```

---

### Data Migration Required

Fix existing incorrectly-named records. For `purchase_802`:

```sql
UPDATE quickbooks_expenses 
SET qb_id = 'purchase_802_split_framing'
WHERE qb_id = 'purchase_802' 
AND category_id = '3ae6ad2e-512d-4d0e-919d-edeae2399906';
```

For `purchase_801` (Jan 28 Home Depot - if it has the same issue):

```sql
-- First check what category the parent has
SELECT qb_id, category_id FROM quickbooks_expenses WHERE qb_id = 'purchase_801';

-- Then rename if needed (assuming it's carpentry based on earlier data)
UPDATE quickbooks_expenses 
SET qb_id = 'purchase_801_split_carpentry'
WHERE qb_id = 'purchase_801';
```

---

### Summary

| Change | Purpose |
|--------|---------|
| Update SmartSplit to rename first category's `qb_id` | All split records follow same naming pattern |
| Data migration for existing records | Fix Jan 28 and Jan 29 transactions |
| No changes needed to filtering logic | The `_split_` pattern detection continues to work correctly |

### Result

After this fix:
- Framing category will show the $119.81 expense
- All split records follow consistent `{parent}_split_{category}` naming
- Parent-exclusion logic correctly ignores actual parent duplicates (if any exist)

