
## Add "Send Back to Queue" Button for QuickBooks Expenses

### What This Does
Adds a button to the Expense Details modal (only visible for QuickBooks expenses) that resets the expense back to the pending queue for re-categorization.

---

### UI Changes

**Location**: Inside the ExpenseDetailModal, in the Actions section at the bottom

**Button appearance**:
- Only visible when viewing a QuickBooks expense (has QB badge)
- Secondary/outline style with warning color
- Icon: RotateCcw or Undo2
- Text: "Send Back to Queue"
- Positioned above the Cancel/Save buttons

---

### Technical Implementation

**File: `src/components/ExpenseDetailModal.tsx`**

1. **Add state and imports**:
   - Import `RotateCcw` or `Undo2` icon from lucide-react
   - Add `isResetting` state to track the operation

2. **Add `handleSendBackToQueue` function**:
   ```typescript
   const handleSendBackToQueue = async () => {
     setIsResetting(true);
     try {
       // Delete any split records first (if this is a parent of splits)
       const { data: expenseData } = await supabase
         .from('quickbooks_expenses')
         .select('qb_id')
         .eq('id', expense.id)
         .single();
       
       if (expenseData?.qb_id) {
         await supabase
           .from('quickbooks_expenses')
           .delete()
           .like('qb_id', `${expenseData.qb_id}_split_%`);
       }
       
       // Reset the expense to pending
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
       
       toast({ title: 'Expense sent back to queue' });
       onExpenseUpdated();
       onOpenChange(false);
     } catch (error) {
       toast({ title: 'Error', variant: 'destructive' });
     }
     setIsResetting(false);
   };
   ```

3. **Add button to UI** (only for QB expenses):
   ```tsx
   {isQuickBooks && (
     <Button
       type="button"
       variant="outline"
       className="w-full text-warning border-warning/50 hover:bg-warning/10"
       onClick={handleSendBackToQueue}
       disabled={isResetting}
     >
       <RotateCcw className="h-4 w-4 mr-2" />
       {isResetting ? 'Sending...' : 'Send Back to Queue'}
     </Button>
   )}
   ```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ExpenseDetailModal.tsx` | Add `isResetting` state, `handleSendBackToQueue` function, and button UI |

---

### Expected Result
- When viewing a QuickBooks expense (shows QB badge), a "Send Back to Queue" button appears
- Clicking it resets the expense back to the pending QuickBooks queue
- Any split records associated with the expense are also removed
- The modal closes and the expenses list refreshes
