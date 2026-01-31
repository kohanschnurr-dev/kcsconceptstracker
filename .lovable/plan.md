

## Fix SmartSplit Double-Counting Bug

### The Problem
When a QuickBooks expense is split via SmartSplit, the original transaction's **amount is not being updated** to reflect only the first category's portion. This causes double-counting in the expense list.

**Example from your data:**
- Original `purchase_769`: $671.60 (showing full amount)
- Split `purchase_769_split_hardware`: $188.38
- Split `purchase_769_split_light_fixtures`: $187.79
- Split `purchase_769_split_plumbing`: $79.01
- Split `purchase_769_split_misc`: $9.71

**Current behavior**: Original $671.60 appears in the list PLUS all the splits = $1,136.49 total  
**Expected behavior**: Original should be updated to ~$206.71 (bathroom portion only) + splits = $671.60 total

---

### Root Cause

In `src/components/SmartSplitReceiptUpload.tsx`, the code updates the original record when `i === 0`:

```typescript
if (i === 0) {
  const { error: qbError } = await supabase
    .from('quickbooks_expenses')
    .update({ 
      is_imported: true,
      amount: categoryAmount,  // <- This SHOULD update the amount
      ...
    })
    .eq('id', originalQbExpenseId);
}
```

The issue is that `categoryAmount` should be the **calculated sum of items in that category**, but it appears the calculation isn't working correctly, or the amount isn't being updated.

---

### Fix Strategy

**Option A: Fix the SmartSplit Logic (Recommended)**
1. Ensure the first category's `categoryAmount` is calculated correctly as the sum of line items for that category
2. Verify the UPDATE query is actually updating the amount field
3. Add validation to confirm amounts sum to original total

**Option B: Filter Split Parents from Display**  
If a record has `_split_` children, exclude the parent from the expense list. This is a workaround but doesn't fix the underlying data issue.

---

### Implementation Plan

#### 1. Debug and Fix SmartSplit Amount Calculation

**File: `src/components/SmartSplitReceiptUpload.tsx`**

Review and fix the `categoryAmount` calculation to ensure:
- Each category's amount is the sum of all line items in that category (quantity × unit_price + proportional tax)
- The UPDATE for the first category (i === 0) actually updates the amount

Add logging to verify amounts:
```typescript
console.log(`Category ${category}: calculated amount = ${categoryAmount}`);
```

#### 2. Add Data Integrity Check

Before saving, verify that all category amounts sum to the original transaction amount:
```typescript
const totalSplitAmount = categoryKeys.reduce((sum, cat) => sum + categoryAmounts[cat], 0);
if (Math.abs(totalSplitAmount - originalAmount) > 0.01) {
  console.warn(`Split amounts (${totalSplitAmount}) don't match original (${originalAmount})`);
}
```

#### 3. Fix Existing Bad Data

For the current `purchase_769` issue, we need to:
1. Calculate the correct bathroom amount from the line items
2. Update the original record's amount to match

**Manual fix query:**
```sql
UPDATE quickbooks_expenses 
SET amount = 206.71  -- bathroom portion
WHERE qb_id = 'purchase_769';
```

Or alternatively, filter the display to show the correct total.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/SmartSplitReceiptUpload.tsx` | Fix category amount calculation and verify UPDATE query |
| Database | Fix existing bad data for `purchase_769` |

---

### Alternative: Display Fix

If we want a quick fix without modifying SmartSplit logic, we can filter the expense query to exclude parent records that have splits:

**File: `src/pages/Expenses.tsx`**

In the QB expenses query, exclude records where `qb_id` is a parent of `_split_` records:
```typescript
// After fetching QB expenses, filter out parent records that have splits
const parentQbIds = qbExpensesData
  .filter(e => e.qb_id.includes('_split_'))
  .map(e => e.qb_id.split('_split_')[0]);

const filteredQbExpenses = qbExpensesData.filter(e => 
  !parentQbIds.includes(e.qb_id) || e.qb_id.includes('_split_')
);
```

---

### Recommended Approach

1. **Immediate fix**: Filter display to exclude parent records with splits (prevents double-counting now)
2. **Proper fix**: Debug and fix the SmartSplit amount calculation for future imports
3. **Data cleanup**: Update the `purchase_769` record to the correct bathroom amount, or delete it and keep only the split records

