

## Plan: Add "Split Manually" Button to Pending Expense Cards

### Overview
Add a "Split Manually" button to pending expense cards so users can manually split a transaction into multiple categories without needing a receipt. This uses the existing `SplitExpenseModal` component.

---

### Current State
- The `SplitExpenseModal` already exists and handles manual splitting
- It's connected to `QuickBooksIntegration` via `handleOpenSplitModal` and `handleSplit` functions
- `GroupedPendingExpenseCard` displays pending expenses but doesn't have access to trigger the split modal

### New Behavior
- Each single expense card will show a "Split" button (split icon)
- Clicking it opens the existing `SplitExpenseModal`
- User can manually split the expense into multiple categories/projects

---

### UI Changes

**Pending Expense Card - Add Split Button:**

```text
Before:
┌─────────────────────────────────────────────────────────────────────┐
│  Zelle payment to                                        $5,000 🗑  │
│  Feb 3, 2026 • Zelle payment...                                     │
│  [Select Project  ▼]  [Select Category  ▼]  [Note...]               │
│                                    [Product] [Labor] [✓]            │
└─────────────────────────────────────────────────────────────────────┘

After:
┌─────────────────────────────────────────────────────────────────────┐
│  Zelle payment to                                        $5,000 🗑  │
│  Feb 3, 2026 • Zelle payment...                                     │
│  [Select Project  ▼]  [Select Category  ▼]  [Note...]               │
│                                [Split] [Product] [Labor] [✓]        │
└─────────────────────────────────────────────────────────────────────┘
```

The "Split" button uses the `Split` icon from Lucide.

---

### Technical Changes

**File: `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**

1. **Add prop for opening split modal:**
   ```typescript
   interface GroupedPendingExpenseCardProps {
     // ... existing props
     onOpenSplitModal?: (expense: PendingExpense) => void;
   }
   ```

2. **Import Split icon:**
   ```typescript
   import { Split, ChevronDown, ChevronUp, ... } from 'lucide-react';
   ```

3. **Add Split button in the single expense action row (near line 217):**
   ```tsx
   <Button
     variant="outline"
     size="sm"
     onClick={() => onOpenSplitModal?.(primaryExpense)}
     className="gap-1"
   >
     <Split className="h-4 w-4" />
     <span className="hidden sm:inline">Split</span>
   </Button>
   ```

**File: `src/components/QuickBooksIntegration.tsx`**

4. **Pass `onOpenSplitModal` to `GroupedPendingExpenseCard`:**
   ```tsx
   <GroupedPendingExpenseCard
     // ... existing props
     onOpenSplitModal={handleOpenSplitModal}
   />
   ```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/quickbooks/GroupedPendingExpenseCard.tsx` | Add `onOpenSplitModal` prop, import Split icon, add Split button in single expense action row |
| `src/components/QuickBooksIntegration.tsx` | Pass `onOpenSplitModal={handleOpenSplitModal}` to GroupedPendingExpenseCard |

---

### Expected Result
- Single expense cards show a "Split" button alongside Product/Labor toggles
- Clicking Split opens the existing manual split modal
- Users can split expenses without needing a receipt

