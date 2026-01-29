

## Make Expense Rows Clickable and Show Cents

Two issues to fix on the Budget page expenses table:

| Issue | Fix |
|-------|-----|
| Clicking expense rows doesn't open details/receipt | Add click-to-open modal like Expenses page |
| Amounts show $82 instead of $82.45 | Change formatCurrency to include cents |

---

## Technical Changes

### File: `src/pages/ProjectBudget.tsx`

**1. Add receipt_url to DBExpense interface (around line 79-92)**

Add these optional fields to the interface:
- `notes?: string | null`
- `receipt_url?: string | null`

**2. Add missing imports**

Import the `ExpenseDetailModal` component and `Paperclip` icon.

**3. Add state for detail modal**

Add state variables:
- `selectedExpense` - the expense to show details for
- `detailModalOpen` - controls the modal visibility

**4. Update formatCurrency function (around line 212-219)**

Change:
```typescript
minimumFractionDigits: 0,
maximumFractionDigits: 0,
```

To:
```typescript
minimumFractionDigits: 2,
```

This will display $82.45 instead of $82.

**5. Make expense table rows clickable (around line 1164)**

Add `onClick` handler to open the detail modal when clicking a row:
```typescript
onClick={() => {
  setSelectedExpense(exp);
  setDetailModalOpen(true);
}}
```

Add `cursor-pointer` to the row class.

**6. Show receipt indicator icon (around line 1181)**

Add a Paperclip icon next to the amount when `receipt_url` exists:
```tsx
{exp.receipt_url && (
  <Paperclip className="h-4 w-4 text-primary" />
)}
```

**7. Add ExpenseDetailModal to the JSX (after line 1299)**

Add the modal component to view expense details and attached receipts:
```tsx
<ExpenseDetailModal
  open={detailModalOpen}
  onOpenChange={setDetailModalOpen}
  expense={selectedExpense ? {
    ...selectedExpense,
    receipt_url: selectedExpense.receipt_url || null,
    notes: selectedExpense.notes || null,
    source: selectedExpense.isQuickBooks ? 'quickbooks' : 'manual',
  } : null}
  projectName={project?.name || ''}
  categoryLabel={selectedExpense ? getCategoryLabel(selectedExpense.category_id) : ''}
  onExpenseUpdated={refreshData}
/>
```

---

## Result

- Clicking any expense row opens the detail modal showing notes, receipt, and full details
- Receipt attachments are indicated with a paperclip icon
- Amounts display with cents (e.g., $82.45 instead of $82)

