

## Plan: Add SmartSplit Receipt Matching for Business Expenses

### Overview
Enable receipt matching for KCS Concepts Business Expenses, following the same pattern as project expenses. Users can upload receipts and match them to existing business expense transactions.

---

### Current State
- Business Expenses already supports manual receipt upload via the `BusinessExpenseDetailModal`
- SmartSplit exists for project expenses with QB transaction matching
- No automated receipt-to-business-expense matching exists

### New Behavior
- Upload a receipt on the Business Expenses page
- System parses receipt (vendor, amount, date)
- Match candidates shown from existing `business_expenses` table
- User confirms match, receipt URL gets attached to the business expense

---

### Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Business Expenses Page                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  Receipt Upload Zone (Collapsible)                                          ││
│  │  [📎 Attach Receipt to Expense]                                             ││
│  │  ┌───────────────────────────────────────────────────────────────────────┐  ││
│  │  │ Drag & drop receipt image or paste (Ctrl+V)                           │  ││
│  │  └───────────────────────────────────────────────────────────────────────┘  ││
│  │                                                                             ││
│  │  Parsed Receipt: Home Depot - $142.50 - Jan 15                              ││
│  │  [Match Candidates from business_expenses:]                                 ││
│  │    ○ Home Depot | $142.50 | Jan 15 | Hardware  ← [Attach Receipt]           ││
│  │    ○ HD Supply  | $142.48 | Jan 14 | Hardware                               ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
│  [Dashboard Cards] [Filters] [Expense Table]                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Technical Changes

**New Component: `src/components/BusinessReceiptUpload.tsx`**

A simplified receipt upload component for business expenses that:
1. Accepts file upload (drag/drop, click, paste)
2. Parses receipt using existing `parse-receipt-image` edge function
3. Queries `business_expenses` table for match candidates (same amount ± $0.05, date within 5 days)
4. Shows match candidates with match indicators (amount, date, vendor)
5. Attaches receipt URL to selected expense on confirmation

**File: `src/pages/BusinessExpenses.tsx`**

1. Import the new `BusinessReceiptUpload` component
2. Add it above the Dashboard Cards section
3. Pass `expenses` array and `onReceiptAttached` callback to refresh data

---

### Component Props

```typescript
interface BusinessReceiptUploadProps {
  expenses: BusinessExpense[];
  onReceiptAttached: () => void;
}
```

---

### Match Algorithm

```typescript
// Find expenses that could match the parsed receipt
const findMatchCandidates = (receipt: ParsedReceipt, expenses: BusinessExpense[]) => {
  return expenses
    .filter(expense => {
      // Amount match: within $0.05
      const amountMatch = Math.abs(expense.amount - receipt.total_amount) <= 0.05;
      // Date match: within 5 days
      const dateMatch = isDateInRange(receipt.purchase_date, expense.date);
      // Must match at least amount OR (date + vendor)
      const vendorMatch = vendorSimilarity(receipt.vendor_name, expense.vendor_name);
      
      return amountMatch || (dateMatch && vendorMatch > 0.5);
    })
    .sort((a, b) => {
      // Score by match quality
      const scoreA = calculateMatchScore(receipt, a);
      const scoreB = calculateMatchScore(receipt, b);
      return scoreB - scoreA;
    })
    .slice(0, 5); // Top 5 candidates
};
```

---

### UI States

1. **Collapsed (default)**: Shows "Attach Receipt to Expense" with paperclip icon
2. **Expanded/Upload**: Drag-drop zone for receipt image
3. **Parsing**: Loading spinner while AI parses receipt
4. **Match Selection**: Shows parsed receipt details + match candidates
5. **Attaching**: Loading state while updating expense

---

### Match Candidate Display

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Parsed Receipt: Home Depot | $142.50 | Jan 15, 2026                     │
├──────────────────────────────────────────────────────────────────────────┤
│  Match to existing expense:                                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ [$][📅][🏢] Home Depot   | $142.50 | Jan 15 | Hardware [Attach ✓] │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ [$][  ][🏢] HD Supply    | $142.48 | Jan 14 | Supplies [Attach]   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Cancel] ← Discard receipt and reset                                    │
└──────────────────────────────────────────────────────────────────────────┘

Legend: [$] Amount matched | [📅] Date in range | [🏢] Vendor matched
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/BusinessReceiptUpload.tsx` | Create | New receipt upload + matching component |
| `src/pages/BusinessExpenses.tsx` | Modify | Import and add BusinessReceiptUpload above dashboard |

---

### Expected Result
- Users can upload receipts directly on the Business Expenses page
- System auto-matches receipt to existing KCS Concepts transactions
- One-click attachment to the correct expense
- Receipt URL saved to `business_expenses.receipt_url` field

