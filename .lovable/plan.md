
## Plan: Enable "Re-Queue" Delete for QuickBooks Expenses

### Current Situation
Found these records for the $671.60 Amazon transaction:

| qb_id | Amount | Status | Category |
|-------|--------|--------|----------|
| `purchase_769` | $671.60 | imported | Bathroom |
| `purchase_769_split_hardware` | $188.38 | imported | Hardware |

### Problem
Currently, deleting a QuickBooks expense completely removes it from the database. The user wants to:
1. Delete specific transactions (like `purchase_769`)
2. Have them reappear in the QuickBooks pending list for re-categorization

### Solution
Modify the delete behavior for QuickBooks expenses:
- Instead of deleting the record, set `is_imported = false` and clear project/category assignment
- This makes the expense reappear in the pending QuickBooks list immediately (no sync needed)
- Also delete any associated split records (`_split_` suffix) so the user can re-split cleanly

### Implementation

**File: `src/components/project/ExpenseActions.tsx`**

Update the `DeleteExpenseDialog` component:

1. **Add `qb_id` to the Expense interface** (needed to find related splits)
   ```typescript
   interface Expense {
     // ... existing fields
     qb_id?: string; // Add this field
   }
   ```

2. **Change delete logic for QuickBooks expenses:**
   ```typescript
   if (expense.isQuickBooks) {
     // First, delete any split records for this expense
     if (expense.qb_id) {
       await supabase
         .from('quickbooks_expenses')
         .delete()
         .like('qb_id', `${expense.qb_id}_split_%`);
     }
     
     // Reset the main expense to pending (instead of deleting)
     await supabase
       .from('quickbooks_expenses')
       .update({
         is_imported: false,
         project_id: null,
         category_id: null,
         expense_type: null,
         notes: null,
         receipt_url: null,
       })
       .eq('id', expense.id);
   }
   ```

3. **Update dialog message** to explain the re-queue behavior:
   ```
   "This expense will be moved back to the QuickBooks pending queue for re-categorization."
   ```

**File: `src/pages/ProjectBudget.tsx`**

Pass `qb_id` when mapping QuickBooks expenses:
```typescript
const qbAsExpenses: DBExpense[] = qbExpenses.map((qb: any) => ({
  // ... existing fields
  qb_id: qb.qb_id, // Add this
}));
```

Update the `DBExpense` interface to include `qb_id`:
```typescript
interface DBExpense {
  // ... existing fields
  qb_id?: string;
}
```

### Immediate Data Cleanup

For the specific $671.60 transaction, both records need to be reset:
- `purchase_769` → reset to pending
- `purchase_769_split_hardware` → delete (it was a split)

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/ExpenseActions.tsx` | Update delete logic to re-queue QB expenses, add `qb_id` to interface |
| `src/pages/ProjectBudget.tsx` | Pass `qb_id` when mapping QB expenses, add to interface |

### Expected Behavior After Fix

1. User clicks "Delete" on a QuickBooks expense
2. Dialog shows: "This expense will be moved back to the QuickBooks pending queue"
3. Expense reappears in pending list immediately (no sync needed)
4. Any splits are removed so user can re-categorize from scratch
5. Regular (non-QB) expenses are still permanently deleted
