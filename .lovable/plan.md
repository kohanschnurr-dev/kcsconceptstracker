

## Plan: Make Paperclip Clickable on Grouped Expense Rows

### Overview
The paperclip icon on grouped expense rows is currently just a visual indicator. It needs to be a clickable button that opens the receipt, matching the behavior of single expense rows.

### Change

**File: `src/components/expenses/GroupedExpenseRow.tsx`**

#### 1. Find the first expense with a receipt (add after line 49)
Add a variable to get the first expense that has a receipt URL, so we know which receipt to open.

#### 2. Make the paperclip a clickable button (lines 167-169)
Replace the static icon with a button that calls `handleViewReceipt`, using `e.stopPropagation()` to prevent the row click from also firing.

### Technical Details

**Current code (lines 165-174):**
```tsx
<td className="!text-center">
  <div className="flex items-center justify-center gap-2">
    {hasReceipt && (
      <Paperclip className="h-4 w-4 text-primary" />
    )}
    <span className="font-mono font-semibold">
      {formatCurrency(totalAmount)}
    </span>
  </div>
</td>
```

**New code:**
```tsx
<td className="!text-center">
  <div className="flex items-center justify-center gap-2">
    {hasReceipt && (
      <button
        onClick={(e) => {
          const expenseWithReceipt = expenses.find(exp => exp.receipt_url);
          if (expenseWithReceipt?.receipt_url) {
            handleViewReceipt(expenseWithReceipt.receipt_url, e);
          }
        }}
        className="text-primary hover:text-primary/80 transition-colors"
        title="View receipt"
      >
        <Paperclip className="h-4 w-4" />
      </button>
    )}
    <span className="font-mono font-semibold">
      {formatCurrency(totalAmount)}
    </span>
  </div>
</td>
```

### Summary of Changes
| Line | Change |
|------|--------|
| 167-169 | Wrap Paperclip in a button with onClick that finds the first expense with a receipt and calls handleViewReceipt |

### Result
- Clicking the orange paperclip on a grouped expense row opens the receipt
- The click is stopped from propagating to the row, so it doesn't also open the expense detail modal
- Matches the existing behavior of single expense rows

