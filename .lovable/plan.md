
## Plan: Fix Duplicate Parent Records in QuickBooks Pending Queue

### Problem

When SmartSplit imports a transaction, the original record's `qb_id` is renamed with a `_split_` suffix (e.g., `purchase_802` becomes `purchase_802_split_framing`). On the next QuickBooks sync, the system looks for `qb_id = 'purchase_802'`, finds nothing (because it was renamed), and creates a **duplicate parent record** with `is_imported: false`. This causes already-imported transactions to reappear in the pending queue.

### Root Cause

```text
Sync Logic (current):
1. Fetch transaction from QuickBooks: qb_id = "purchase_802"
2. Check: Does qb_id = "purchase_802" exist? → NO (it was renamed to "_split_")
3. Insert new record with qb_id = "purchase_802", is_imported = false
4. Result: Duplicate parent appears in pending queue
```

### Solution

Modify the sync function to check for **split records** before inserting new transactions:

```text
Sync Logic (fixed):
1. Fetch transaction from QuickBooks: qb_id = "purchase_802"
2. Check: Does qb_id = "purchase_802" exist? → NO
3. NEW CHECK: Do any records with qb_id LIKE "purchase_802_split_%" exist? → YES
4. Skip insert (splits already exist)
5. Result: No duplicate, queue stays clean
```

---

### Technical Changes

**File: `supabase/functions/quickbooks-sync/index.ts`**

| Lines | Change |
|-------|--------|
| 244-284 | Add split detection logic before upsert |

**Updated Sync Logic:**

```typescript
for (const expense of expenses) {
  // First, check if this expense already exists and has been assigned
  const { data: existing } = await serviceSupabase
    .from("quickbooks_expenses")
    .select("id, project_id, category_id, is_imported")
    .eq("user_id", expense.user_id)
    .eq("qb_id", expense.qb_id)
    .maybeSingle();
  
  if (existing && (existing.project_id || existing.is_imported)) {
    // Expense was already assigned - only update non-assignment fields
    // ... (existing update logic)
    skippedCount++;
  } else if (!existing) {
    // NEW: Check if splits exist for this transaction
    const { data: existingSplits } = await serviceSupabase
      .from("quickbooks_expenses")
      .select("id")
      .eq("user_id", expense.user_id)
      .like("qb_id", `${expense.qb_id}_split_%`)
      .limit(1);
    
    if (existingSplits && existingSplits.length > 0) {
      // Splits exist - skip inserting parent record
      skippedCount++;
      console.log(`Skipping ${expense.qb_id} - splits already exist`);
    } else {
      // New expense - full upsert
      const { error } = await serviceSupabase
        .from("quickbooks_expenses")
        .upsert(expense, { onConflict: "user_id,qb_id" });
      
      if (!error) {
        successCount++;
      }
    }
  } else {
    // Existing but not yet assigned - update it
    const { error } = await serviceSupabase
      .from("quickbooks_expenses")
      .upsert(expense, { onConflict: "user_id,qb_id" });
    
    if (!error) {
      successCount++;
    }
  }
}
```

---

### Cleanup: Remove Existing Orphan Parents

After deploying the fix, we also need to clean up existing orphan parent records. We can either:

1. **Manual SQL cleanup** (one-time):
   ```sql
   DELETE FROM quickbooks_expenses 
   WHERE is_imported = false 
     AND qb_id NOT LIKE '%_split_%'
     AND EXISTS (
       SELECT 1 FROM quickbooks_expenses splits 
       WHERE splits.qb_id LIKE quickbooks_expenses.qb_id || '_split_%'
     );
   ```

2. **Add cleanup logic to fetchPendingExpenses** in the frontend to filter out orphan parents

I recommend option 1 (SQL cleanup) for existing data, plus the edge function fix for future syncs.

---

### Files to Modify

| File | Action |
|------|--------|
| `supabase/functions/quickbooks-sync/index.ts` | Add split detection before insert |

### Result

- Future syncs will not recreate parent records when splits exist
- The Home Depot $211.42 transaction will no longer appear in the pending queue after cleanup
- SmartSplit workflow will continue to work correctly
