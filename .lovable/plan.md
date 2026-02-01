
## Plan: Remove Paperclip Icons from Expanded Child Rows

### Overview
Remove the redundant paperclip icons from the expanded child rows in grouped expenses. The parent row already shows a paperclip if any expense in the group has a receipt, so showing it again on each child row adds visual clutter.

### Change

**File: `src/components/expenses/GroupedExpenseRow.tsx`**

Remove the paperclip button from child rows (lines 209-217), keeping only the amount display.

### Technical Details

**Current code (lines 207-222):**
```tsx
<td className="!text-center">
  <div className="flex items-center justify-center gap-2">
    {expense.receipt_url && (
      <button
        onClick={(e) => handleViewReceipt(expense.receipt_url!, e)}
        className="text-primary hover:text-primary/80 transition-colors"
        title="View receipt"
      >
        <Paperclip className="h-4 w-4" />
      </button>
    )}
    <span className="font-mono text-sm">
      {formatCurrency(expense.amount)}
    </span>
  </div>
</td>
```

**New code:**
```tsx
<td className="!text-center">
  <span className="font-mono text-sm">
    {formatCurrency(expense.amount)}
  </span>
</td>
```

### Result
- Parent row continues to show a paperclip icon if any child has a receipt
- Child rows display only the amount without individual paperclip icons
- Cleaner, less cluttered expanded view
