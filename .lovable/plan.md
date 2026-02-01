

## Plan: Parent Receipt Detail Modal with Grouped Send-Back

### Overview

Create a new modal or enhance the existing one to display grouped expenses as a complete receipt view, with a single action to send all related splits back to the QuickBooks queue at once.

### Current Flow

1. User clicks parent row (e.g., "Home Depot - 4 items")
2. Modal opens showing only the first expense
3. "Send Back to Queue" only resets that single item
4. User must repeat for each split - very tedious

### Proposed Solution

Create a new `GroupedExpenseDetailModal` component that:
- Shows the parent receipt summary (vendor, date, total)
- Lists all child splits with their categories and amounts
- Provides a single "Send All Back to Queue" button that resets ALL related records at once

---

### Technical Changes

#### 1. New Component: `GroupedExpenseDetailModal.tsx`

Create a new modal component specifically for viewing grouped/split expenses:

| Section | Content |
|---------|---------|
| Header | "Receipt Details" with vendor name and QB badge |
| Summary | Date, total amount, payment method |
| Items List | Scrollable list of all splits with category, description, amount |
| Receipt | Single receipt preview (shared across splits) |
| Notes | Combined or individual notes |
| Actions | "Send All Back to Queue" button that handles entire group |

**Key props:**
```typescript
interface GroupedExpenseDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: DBExpense[]; // All expenses in the group
  projectName: string;
  getCategoryLabel: (categoryId: string, projectId: string) => string;
  onExpenseUpdated: () => void;
}
```

#### 2. Update `GroupedExpenseRow.tsx`

Change the parent row click handler to pass the ENTIRE expense group instead of just the first expense:

```typescript
// Current
onClick={() => onExpenseClick(parentExpense)}

// New prop needed
onGroupClick?: (expenses: DBExpense[]) => void;
```

#### 3. Update `Expenses.tsx`

Add state and handler for grouped expense selection:

```typescript
const [selectedExpenseGroup, setSelectedExpenseGroup] = useState<DBExpense[] | null>(null);
const [groupDetailModalOpen, setGroupDetailModalOpen] = useState(false);
```

Update the `GroupedExpenseRow` to call `onGroupClick` for parent row clicks (when it has multiple items) and `onExpenseClick` for single expenses or child rows.

---

### UI Design

**Grouped Receipt Detail Modal:**

```text
┌─────────────────────────────────────────────────────────────┐
│ 📄 Receipt Details                               [QB] [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Home Depot                                                 │
│  Jan 29, 2026 • Card                           $211.42     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  4 Items                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Framing         LP SMARTSIDE 8'X16'...    $119.81   │   │
│  │ Drywall         USG SHEETROCK BRAND...     $31.60   │   │
│  │ Demolition      HUSKY HUSKY 42G CONT...    $32.44   │   │
│  │ Hardware        GRIP-RITE 3" PG10 EXT...   $27.57   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [📎 View Receipt]                                         │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ⟲ Send All Back to Queue    │    🗑 Delete All    │ Save  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Backend Logic: Send All Back

The `handleSendAllBackToQueue` function will:

1. Get the parent `qb_id` (e.g., `purchase_802`)
2. Delete all split records from `quickbooks_expenses` where `qb_id` starts with `purchase_802_split_`
3. Re-create a single pending expense with the original amount (from `original_amount` column if exists, or sum of splits)

```typescript
const handleSendAllBackToQueue = async () => {
  // Get the parent qb_id
  const parentQbId = expenses[0].qb_id?.replace(/_split_.*$/, '');
  
  // 1. Get original amount from any record (stored in original_amount column)
  const { data: firstRecord } = await supabase
    .from('quickbooks_expenses')
    .select('original_amount, vendor_name, date, payment_method')
    .like('qb_id', `${parentQbId}%`)
    .limit(1)
    .single();
  
  // 2. Delete all split records for this parent
  await supabase
    .from('quickbooks_expenses')
    .delete()
    .like('qb_id', `${parentQbId}_split_%`);
  
  // 3. Reset the parent record (or create new pending if needed)
  await supabase
    .from('quickbooks_expenses')
    .upsert({
      qb_id: parentQbId,
      amount: firstRecord.original_amount,
      vendor_name: firstRecord.vendor_name,
      date: firstRecord.date,
      payment_method: firstRecord.payment_method,
      is_imported: false,
      project_id: null,
      category_id: null,
    });
};
```

---

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/GroupedExpenseDetailModal.tsx` | Create | New modal for viewing grouped receipts |
| `src/components/expenses/GroupedExpenseRow.tsx` | Modify | Add `onGroupClick` prop for parent row clicks |
| `src/pages/Expenses.tsx` | Modify | Add state for group modal, pass handler to row |

---

### Summary

| Change | Purpose |
|--------|---------|
| New `GroupedExpenseDetailModal` | Shows full receipt with all splits in one view |
| Add `onGroupClick` handler | Distinguishes parent row click from child row click |
| "Send All Back to Queue" action | Resets entire transaction group in one click |
| Preserve original amount | Uses `original_amount` column to restore correct pending value |

### Result

- Clicking the parent "Home Depot" row opens a full receipt view with all 4 items
- Single button sends all splits back to the QuickBooks pending queue
- Child rows can still be clicked individually to edit a specific split
- No more clicking through each item one by one

