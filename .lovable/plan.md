

## Plan: Group Split Expenses in QuickBooks Pending Queue

### Problem Identified

After SmartSplit processes a receipt, it creates multiple `_split_` records (e.g., `purchase_769_split_hardware`, `purchase_769_split_light_fixtures`). These appear in the QuickBooks Integration pending queue as **individual expense cards**, each requiring separate project/category selection.

**Current behavior:**
- SmartSplit creates 5 records for `purchase_769`
- Each shows as a separate pending expense card ($187.79, $188.38, etc.)
- User has to categorize each one individually

**Expected behavior:**
- Split expenses should be grouped under one parent row
- Show total amount with expandable child items
- Categorize children all at once or individually expand to see the breakdown

### Root Cause

The `fetchPendingExpenses` function in `useQuickBooks.ts` fetches all records with `is_imported: false` without grouping split expenses. The `QuickBooksIntegration.tsx` component then renders each one as a separate card.

### Solution

Add grouping logic in the QuickBooks Integration component to group split expenses together, similar to how the main Expenses page handles it.

---

### Technical Changes

**File: `src/components/QuickBooksIntegration.tsx`**

1. Add a memo to group pending expenses by parent QB transaction ID:

```typescript
// Group pending expenses by parent QB transaction ID
const groupedPendingExpenses = useMemo(() => {
  const groups: Map<string, typeof pendingExpenses> = new Map();
  
  pendingExpenses.forEach((expense) => {
    let parentId = expense.qb_id;
    
    // Extract parent ID from split pattern
    const splitMatch = expense.qb_id?.match(/^(.+?)_split_/);
    if (splitMatch) {
      parentId = splitMatch[1];
    }
    
    if (!groups.has(parentId)) {
      groups.set(parentId, []);
    }
    groups.get(parentId)!.push(expense);
  });
  
  return Array.from(groups.values()).sort((a, b) => 
    new Date(b[0].date).getTime() - new Date(a[0].date).getTime()
  );
}, [pendingExpenses]);
```

2. Create a new `GroupedPendingExpenseCard` component that:
   - Displays parent info (vendor, date, total amount)
   - Shows "X items" indicator for grouped expenses
   - Allows expanding to see individual split line items
   - Each child row shows its category (if already assigned) and amount
   - Individual children can be re-categorized or the whole group can be imported

3. Update the rendering loop to use `groupedPendingExpenses` instead of `pendingExpenses`

---

### UI Design for Grouped Pending Expense

**Collapsed state:**
```
┌─────────────────────────────────────────────────────────┐
│ ▶ Amazon    [Receipt]                        $671.60   │
│   Jan 19, 2026 • 5 items split                         │
│   ─────────────────────────────────────────────────    │
│   [Select Project ▼] [Select Category ▼]  [Notes]      │
│                               [Product] [Labor] [✓]    │
└─────────────────────────────────────────────────────────┘
```

**Expanded state:**
```
┌─────────────────────────────────────────────────────────┐
│ ▼ Amazon    [Receipt]                        $671.60   │
│   Jan 19, 2026 • 5 items                               │
│   ├── Light Fixtures                         $187.79   │
│   ├── Hardware                               $188.38   │
│   ├── Kitchen                                $79.01    │
│   ├── Misc                                   $9.71     │
│   └── Plumbing                               $79.01    │
│   ─────────────────────────────────────────────────    │
│   Categories already assigned via SmartSplit           │
│                                     [Import All ✓]     │
└─────────────────────────────────────────────────────────┘
```

---

### Key Behaviors

| Scenario | Behavior |
|----------|----------|
| Single expense (no splits) | Display as normal, user selects project/category |
| Split expenses from SmartSplit | Group together, show total, expand to see breakdown |
| Splits already have categories | Show "Import All" button to mark all as imported |
| Some splits need categories | Allow individual categorization within expanded view |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/QuickBooksIntegration.tsx` | Add grouping memo, create grouped card rendering logic |
| `src/hooks/useQuickBooks.ts` | Add `importAllSplits` function to mark multiple records as imported at once |

---

### Summary

This change ensures that SmartSplit expenses remain visually grouped in the pending queue, matching user expectations. The parent row shows the total amount, and users can expand to see individual split line items. This eliminates the need to categorize each split separately when they've already been processed by SmartSplit.

