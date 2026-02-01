

## Plan: Fix Jan 29 Data and Prevent Future Data Loss

### Problem Summary

The Jan 29 Home Depot transaction (`purchase_802`) was imported **before** the SmartSplit fix. The data shows:
- Current total: $303.65 (sum of raw receipt line items)
- This is incorrect - it should equal the original QuickBooks bank transaction amount

The core issue: **SmartSplit overwrites the original QB expense amount**, so we've lost the true bank transaction value.

### Solution: Two Parts

---

### Part 1: Data Migration to Fix Jan 29

We need to determine what the original transaction amount was. Based on the pattern:
- Jan 28 was fixed and totals $111.47 (the actual bank charge)
- The user needs to confirm what the actual Jan 29 Home Depot charge was from their bank/QuickBooks

**Option A**: If user knows the correct total, run SQL to scale amounts proportionally
**Option B**: Re-sync from QuickBooks and re-run SmartSplit

---

### Part 2: Prevent Future Data Loss

Store the original QB transaction amount before overwriting, so we can always reference it.

**File: Database Schema Change**

Add `original_amount` column to `quickbooks_expenses` table:

```sql
ALTER TABLE quickbooks_expenses 
ADD COLUMN original_amount DECIMAL(12,2);
```

**File: `src/components/SmartSplitReceiptUpload.tsx`**

Before updating the first QB expense record, store the original amount:

| Lines | Change |
|-------|--------|
| ~618-640 | Before the update, set `original_amount` to preserve the true bank value |

```typescript
// Store original amount before we overwrite it
const { error: preserveError } = await supabase
  .from('quickbooks_expenses')
  .update({ original_amount: selectedMatch.qbExpense.amount })
  .eq('id', originalQbExpenseId)
  .is('original_amount', null); // Only if not already set

// Then proceed with the category update
const { data: updateResult, error: qbError } = await supabase
  .from('quickbooks_expenses')
  .update({ 
    amount: categoryAmount,
    // ... rest of fields
  })
```

---

### Immediate Data Fix

For the Jan 29 transaction, we need the user to confirm the actual bank amount. Once known, run:

```sql
-- Example if actual amount was $150
UPDATE quickbooks_expenses 
SET amount = ROUND(amount * (150.00 / 303.65), 2)
WHERE qb_id LIKE 'purchase_802%';
```

This scales all splits proportionally to match the true total.

---

### Summary

| Change | Purpose |
|--------|---------|
| Add `original_amount` column | Preserve true bank transaction amount |
| Update SmartSplit to save original before overwriting | Prevent future data loss |
| Data migration for Jan 29 | Fix existing incorrect data |

