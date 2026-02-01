

## Plan: Fix Grouped Expense Collapsing for Split Transactions

### Root Cause

The grouping logic in `Expenses.tsx` is checking `expense.id` (which is a random UUID) for the `_split_` pattern. However, the split identifier is actually in the `qb_id` field (e.g., `purchase_801_split_drywall`), which is NOT being passed through to the expense list.

**Database evidence:**
```
id: dc8eb3ae-5fdd-424c-9e51-cf7c225e7c1f
qb_id: purchase_801_split_drywall  ← This has the pattern, but isn't used
```

---

### Solution

Add `qb_id` to the DBExpense interface and use it for grouping logic.

---

### Technical Implementation

**File: `src/pages/Expenses.tsx`**

**1. Add `qb_id` to the DBExpense interface (line 48-63)**

```typescript
interface DBExpense {
  id: string;
  project_id: string;
  category_id: string;
  amount: number;
  date: string;
  vendor_name: string | null;
  payment_method: 'cash' | 'check' | 'card' | 'transfer' | null;
  status: 'estimate' | 'actual';
  description: string | null;
  includes_tax: boolean;
  tax_amount: number | null;
  notes?: string | null;
  receipt_url?: string | null;
  source?: 'manual' | 'quickbooks';
  qb_id?: string | null;  // ← ADD THIS
}
```

**2. Add `qb_id` to the DBQuickBooksExpense interface (line 65-77)**

```typescript
interface DBQuickBooksExpense {
  id: string;
  qb_id: string;  // ← ADD THIS
  project_id: string | null;
  // ... rest stays the same
}
```

**3. Pass `qb_id` when transforming QB expenses (line 161-178)**

```typescript
const qbExpenses: DBExpense[] = filteredQbExpenses
  .filter((e: DBQuickBooksExpense) => e.project_id && e.category_id)
  .map((e: DBQuickBooksExpense) => ({
    id: e.id,
    project_id: e.project_id!,
    category_id: e.category_id!,
    amount: e.amount,
    date: e.date,
    vendor_name: e.vendor_name,
    payment_method: e.payment_method as DBExpense['payment_method'],
    status: 'actual' as const,
    description: e.description,
    includes_tax: false,
    tax_amount: null,
    notes: e.notes || null,
    receipt_url: e.receipt_url || null,
    source: 'quickbooks' as const,
    qb_id: e.qb_id,  // ← ADD THIS
  }));
```

**4. Fix the grouping logic to use `qb_id` (lines 296-314)**

```typescript
const groupedExpenses = useMemo(() => {
  const groups: Map<string, typeof filteredExpenses> = new Map();
  
  filteredExpenses.forEach((expense) => {
    // For QB expenses, check qb_id for split pattern
    // For manual expenses, use id as the group key
    let parentId = expense.id;
    
    if (expense.source === 'quickbooks' && expense.qb_id) {
      const splitMatch = expense.qb_id.match(/^(.+?)_split_/);
      if (splitMatch) {
        parentId = splitMatch[1]; // e.g., "purchase_801"
      } else {
        parentId = expense.qb_id; // Use qb_id as the key for consistency
      }
    }
    
    if (!groups.has(parentId)) {
      groups.set(parentId, []);
    }
    groups.get(parentId)!.push(expense);
  });
  
  // Convert to array and sort by first expense date
  return Array.from(groups.values()).sort((a, b) => {
    return new Date(b[0].date).getTime() - new Date(a[0].date).getTime();
  });
}, [filteredExpenses]);
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Expenses.tsx` | Add `qb_id` to interfaces, pass it through transformation, fix grouping logic |

---

### Expected Result

After this fix:
- All Home Depot split expenses (`purchase_801_split_drywall`, `purchase_801_split_painting`, etc.) will group under a single collapsible row
- The parent row will show "Home Depot" with "Multiple" category badge and combined total ($111.48)
- Clicking the row expands to show individual line items (Drywall $15.04, Painting $69.44, etc.)
- Manual expenses continue to work as individual rows

