
## Fix: Receipt Viewing & Payment Method Inheritance for Split Expenses

### Issues Identified

| Issue | Current State | Expected Behavior |
|-------|---------------|-------------------|
| **Chrome blocks receipt** | Receipt URL opens in new tab via `ExternalLink` in modal, but row click goes to modal first | Need direct clickable paperclip |
| **Payment method missing on splits** | Split expenses have `payment_method: null` | Should inherit from parent QB transaction (e.g., "card") |
| **Paperclip not clickable** | Paperclip icon is just visual indicator in expenses table | Should open receipt directly when clicked |

### Root Cause Analysis

**Database query confirms the issue:**
- Main transaction (`purchase_769`) has `payment_method: card`
- All split records (`purchase_769_split_*`) have `payment_method: null`

The `SmartSplitReceiptUpload.tsx` import logic does NOT copy `payment_method` from the original QuickBooks expense when creating splits.

---

### Solution

**Part 1: Add payment_method to split imports**

Update the `MatchedExpense` interface to include `payment_method`:
```typescript
interface MatchedExpense {
  receipt: PendingReceipt;
  qbExpense: {
    id: string;
    vendor_name: string;
    amount: number;
    date: string;
    description?: string;
    payment_method?: string;  // Add this
  };
}
```

Update the insert/update logic for split records to include `payment_method`:
```typescript
// When inserting new split
payment_method: selectedMatch.qbExpense.payment_method || null,

// When updating existing split
payment_method: selectedMatch.qbExpense.payment_method || null,
```

**Part 2: Make paperclip clickable in expenses table**

In `src/pages/Expenses.tsx`, change the Paperclip from a visual icon to a clickable button that opens the receipt:

```tsx
{expense.receipt_url && (
  <button
    onClick={(e) => {
      e.stopPropagation(); // Prevent row click (opening modal)
      window.open(expense.receipt_url, '_blank');
    }}
    className="text-primary hover:text-primary/80"
    title="View receipt"
  >
    <Paperclip className="h-4 w-4" />
  </button>
)}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/SmartSplitReceiptUpload.tsx` | Add `payment_method` to interface and include in insert/update logic for splits |
| `src/pages/Expenses.tsx` | Make Paperclip icon clickable to open receipt URL |

---

### Technical Details

**SmartSplitReceiptUpload.tsx changes:**

1. **Line ~42-51**: Update `MatchedExpense.qbExpense` interface to include `payment_method?: string;`

2. **Line ~169-177**: When mapping qbExpenses to matches, the full object is already passed, so `payment_method` will be available

3. **Line ~514-525**: First category update - add `payment_method`
4. **Line ~537-549**: Update existing split - add `payment_method`
5. **Line ~553-569**: Insert new split - add `payment_method`

**Expenses.tsx changes:**

1. **Line ~456-467**: Wrap Paperclip in clickable button with `onClick` that opens receipt URL, using `e.stopPropagation()` to prevent triggering the row click

---

### Expected Results

1. Clicking the orange paperclip icon opens the receipt in a new tab
2. All split expenses inherit the payment method (cash/card) from the parent transaction
3. Chrome won't block since we're using `window.open` with user interaction
