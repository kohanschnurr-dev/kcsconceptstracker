

## Fix: Duplicate Key Error on Split Import

### Problem
When clicking "Match & Import", you get: `"duplicate key value violates unique constraint 'quickbooks_expenses_user_id_qb_id_key'"`

### Root Cause Analysis

From the database investigation:

| Record | Status | Notes |
|--------|--------|-------|
| Pending Receipt #1 (`fc7a1fc1...`) | `imported` | Already processed successfully |
| Pending Receipt #2 (`ba605af0...`) | `matched` | Trying to import again - FAILING |

Both receipts point to the same QuickBooks expense `purchase_769`. When the second one tries to create `purchase_769_split_hardware`, it fails because that record already exists from the first import.

**Existing split records:**
- `purchase_769` - Bathroom ($206.71)
- `purchase_769_split_hardware` - Hardware ($188.38)

---

### Solution: Multi-Part Fix

**Part 1: Use UPSERT instead of INSERT for split records**

Change the insert logic to use `upsert` with `onConflict`, so if a split already exists, it gets updated instead of causing an error.

**Part 2: Add timestamp suffix to make split IDs unique**

Change the qb_id pattern from:
```
${originalQbId}_split_${category}
```
To:
```
${originalQbId}_split_${category}_${Date.now()}
```

This ensures each import attempt creates unique records.

**Part 3: Skip already-imported receipts**

Add a check in the import flow to detect if the matched QB expense has already been processed (has split records), and warn the user.

---

### Implementation

**File:** `src/components/SmartSplitReceiptUpload.tsx`

#### Change 1: Add uniqueness to split qb_id (line 510)

```typescript
// Add timestamp for uniqueness
const uniqueSuffix = Date.now();

// In the insert block:
qb_id: `${originalQbId}_split_${category}_${uniqueSuffix}`,
```

#### Change 2: Use upsert instead of insert (lines 506-521)

```typescript
// Check if this split already exists
const splitQbId = `${originalQbId}_split_${category}`;
const { data: existingSplit } = await supabase
  .from('quickbooks_expenses')
  .select('id')
  .eq('qb_id', splitQbId)
  .maybeSingle();

if (existingSplit) {
  // Update existing split record
  await supabase
    .from('quickbooks_expenses')
    .update({
      amount: categoryAmount,
      category_id: categoryId,
      project_id: selectedProject,
      expense_type: expenseType,
      notes: itemNotes,
      receipt_url: selectedMatch.receipt.receipt_image_url || null,
    })
    .eq('id', existingSplit.id);
} else {
  // Insert new split record
  await supabase
    .from('quickbooks_expenses')
    .insert({
      user_id: user.id,
      qb_id: splitQbId,
      vendor_name: selectedMatch.qbExpense.vendor_name,
      amount: categoryAmount,
      date: selectedMatch.qbExpense.date,
      description: selectedMatch.qbExpense.description,
      is_imported: true,
      project_id: selectedProject,
      category_id: categoryId,
      expense_type: expenseType,
      notes: itemNotes,
      receipt_url: selectedMatch.receipt.receipt_image_url || null,
    });
}
```

#### Change 3: Add pre-import validation to detect duplicates (before line 415)

```typescript
// Check if this QB expense was already split-imported
const { data: existingSplits } = await supabase
  .from('quickbooks_expenses')
  .select('id, qb_id')
  .like('qb_id', `${selectedMatch.qbExpense.qb_id}_split_%`);

if (existingSplits && existingSplits.length > 0) {
  // Warn user that this receipt may have been imported before
  const confirmed = window.confirm(
    `This QuickBooks transaction appears to have been split-imported before (${existingSplits.length} existing splits found). Continuing will update those records. Proceed?`
  );
  if (!confirmed) {
    setIsImporting(false);
    return;
  }
}
```

---

### Data Cleanup

Clean up the duplicate pending receipt that's already been imported:

```sql
-- Delete the duplicate pending receipt that was already processed
DELETE FROM pending_receipts 
WHERE id = 'ba605af0-40e6-45b8-90cb-d22bcc76502e' 
AND status = 'matched';
```

Or update it to `imported` status to clear it from the queue:

```sql
UPDATE pending_receipts 
SET status = 'imported' 
WHERE id = 'ba605af0-40e6-45b8-90cb-d22bcc76502e';
```

---

### Files to Modify

| File | Changes |
|------|--------|
| `src/components/SmartSplitReceiptUpload.tsx` | Add duplicate detection, use check-then-upsert pattern for splits |

---

### Expected Results

1. Re-importing a receipt updates existing splits instead of failing
2. User gets a confirmation dialog if splits already exist
3. No more unique constraint violations
4. Duplicate receipts can be safely handled

