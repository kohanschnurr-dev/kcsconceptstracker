

## Plan: Clean Up Orphan Parent QuickBooks Records

### Problem Confirmed

The database contains an orphan parent record (`purchase_802`) with `is_imported: false` while its split children exist with `is_imported: true`. This is why Home Depot $211.42 still appears in the pending queue despite the edge function fix being deployed.

**Evidence from network logs:**
```
qb_id: "purchase_802"
amount: 211.42
is_imported: false  ← Orphan parent still exists!
```

**Evidence from database:**
```
purchase_802_split_demolition → is_imported: true
purchase_802_split_drywall → is_imported: true
purchase_802_split_framing → is_imported: true
purchase_802_split_hardware → is_imported: true
```

---

### Solution

**Step 1: Database Cleanup Migration**

Create a SQL migration to delete ALL existing orphan parent records where splits already exist:

```sql
DELETE FROM quickbooks_expenses parent
WHERE parent.is_imported = false 
  AND parent.qb_id NOT LIKE '%_split_%'
  AND EXISTS (
    SELECT 1 
    FROM quickbooks_expenses splits 
    WHERE splits.qb_id LIKE parent.qb_id || '_split_%'
      AND splits.user_id = parent.user_id
  );
```

This will:
- Find parent records (`qb_id` without `_split_`)
- That are not imported (`is_imported = false`)
- Where split records already exist for the same transaction
- Delete only those orphan parents

**Step 2: Verify Edge Function Fix**

The edge function was already updated to prevent future orphans. After cleanup, the sync will work correctly.

---

### Files to Modify

| File | Action |
|------|--------|
| Database migration | Execute cleanup SQL |

---

### Result

- Home Depot $211.42 will be removed from the pending queue
- Any other orphan parents will also be cleaned up
- Future syncs will not recreate parent records when splits exist

