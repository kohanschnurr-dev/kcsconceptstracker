

## Fix Loan Import + Add "Send Back to Queue"

### Problem

1. **Loan import doesn't work in production mode**: The non-demo path of `categorizeExpense` in `useQuickBooks.ts` only updates `quickbooks_expenses` to `is_imported = true` but never inserts a row into the `expenses` table. The demo-mode path correctly does both. This is why clicking the check button appears to do nothing -- the QB expense gets marked as imported (disappears on next refresh) but no expense record is created.

2. **No undo mechanism**: If a user accidentally imports something as a loan, there's no way to send it back to the pending queue.

### Changes

**1. `src/hooks/useQuickBooks.ts` -- Fix non-demo categorize to insert into expenses**

In the non-demo `categorizeExpense` block (around line 531), add an insert into the `expenses` table before marking the QB expense as imported. This mirrors what the demo path already does:
- Fetch the QB expense data
- Insert into `expenses` with `category_id: null` for loans, proper category for others
- Then mark `quickbooks_expenses` as imported
- Then insert into `loan_payments` if loan type

**2. `src/components/project/LoanPayments.tsx` -- Add "Send Back to Queue"**

For payments with `source: 'quickbooks'`, add a small "undo" / "send back" button (e.g., an Undo icon) next to the delete button. When clicked:
- Delete the `loan_payments` record
- Delete the corresponding `expenses` record (using `expense_id` to find the QB source)
- Set `quickbooks_expenses.is_imported = false` for that `expense_id` to put it back in the pending queue
- Show a toast confirming the item was sent back

**3. Visual feedback on the pending card**

No changes needed here -- the card already shows a loading spinner on the check button and removes the item on success. The fix to the insert logic will make it work correctly.

### Technical Details

Non-demo categorize fix (in `useQuickBooks.ts`):
```typescript
// Before marking as imported, insert the actual expense
const expense = pendingExpenses.find(e => e.id === expenseId);
if (expense) {
  await supabase.from('expenses').insert({
    project_id: projectId,
    category_id: categoryId, // null for loans
    amount: expense.amount,
    date: expense.date,
    vendor_name: expense.vendor_name,
    description: expense.description,
    payment_method: 'transfer',
    status: 'actual',
    includes_tax: false,
    expense_type: expenseType,
    notes: notes || null,
  });
}
```

Send-back logic (in `LoanPayments.tsx`):
```typescript
const handleSendBack = async (payment: LoanPayment) => {
  // 1. Delete loan_payments record
  await supabase.from('loan_payments').delete().eq('id', payment.id);
  // 2. Delete expenses record linked to this QB expense
  if (payment.expense_id) {
    await supabase.from('expenses').delete()
      .eq('project_id', projectId)
      .eq('description', payment.description)
      .eq('amount', payment.amount);
    // 3. Un-import the QB expense
    await supabase.from('quickbooks_expenses')
      .update({ is_imported: false, expense_type: null })
      .eq('id', payment.expense_id);
  }
  // 4. Refresh and notify
  await fetchPayments();
  toast({ title: 'Sent Back', description: 'Payment returned to pending queue' });
};
```

The `expense_id` field on `loan_payments` stores the original QB expense ID, making the reversal straightforward.

### No database changes needed
All tables and columns already exist.
