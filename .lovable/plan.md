

## Plan: Collapsible Expenses Table + Resizable QuickBooks Pending Area

### Overview

1. **Expenses Table**: Wrap the expenses table in a collapsible section with a header showing the count and total, allowing users to collapse/expand it when dealing with many expenses.

2. **QuickBooks Pending Area**: Replace the fixed `max-h-[400px]` scroll container with a resizable panel that has a visible drag handle at the bottom, allowing users to manually adjust how much space the pending expenses take up.

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/pages/Expenses.tsx` | Wrap expenses table in Collapsible component |
| `src/components/QuickBooksIntegration.tsx` | Replace fixed max-height with resizable panel using a draggable divider |

---

### UI Design

**Expenses Table (Collapsible):**
```text
┌────────────────────────────────────────────────────────┐
│ ▼ Expenses Table    47 expenses • $23,456.78   [─]    │
├────────────────────────────────────────────────────────┤
│ Date     Vendor     Project    Category   Payment  Amt │
│ ...                                                    │
│ ...                                                    │
└────────────────────────────────────────────────────────┘

Collapsed:
┌────────────────────────────────────────────────────────┐
│ ▶ Expenses Table    47 expenses • $23,456.78   [+]    │
└────────────────────────────────────────────────────────┘
```

**QuickBooks Pending Area (Resizable):**
```text
┌────────────────────────────────────────────────────────┐
│ Pending from QuickBooks                                │
├────────────────────────────────────────────────────────┤
│ [Expense Card 1]                                       │
│ [Expense Card 2]                                       │
│ [Expense Card 3]                                       │
│ ...                                                    │
├────────────────────────────────────────────────────────┤
│ ═══════════════════ ⋮⋮⋮ ═══════════════════           │  ← Drag handle
└────────────────────────────────────────────────────────┘
```

---

### Technical Details

#### 1. Expenses.tsx - Collapsible Expenses Table

**Add imports:**
```typescript
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
```

**Add state:**
```typescript
const [expensesTableOpen, setExpensesTableOpen] = useState(true);
```

**Wrap the expenses table section:**
```tsx
<Collapsible open={expensesTableOpen} onOpenChange={setExpensesTableOpen}>
  <div className="glass-card overflow-hidden">
    <CollapsibleTrigger asChild>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors border-b border-border/30">
        <div className="flex items-center gap-2">
          <ChevronDown className={`h-4 w-4 transition-transform ${expensesTableOpen ? '' : '-rotate-90'}`} />
          <span className="font-medium">Expenses Table</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{filteredExpenses.length} expenses</span>
          <span>•</span>
          <span className="font-mono">{formatCurrency(totalExpenses)}</span>
        </div>
      </div>
    </CollapsibleTrigger>
    
    <CollapsibleContent>
      <div className="overflow-x-auto">
        <table className="data-table">
          {/* ... existing table content ... */}
        </table>
      </div>
      {filteredExpenses.length === 0 && (
        <div className="text-center py-12">
          {/* ... empty state ... */}
        </div>
      )}
    </CollapsibleContent>
  </div>
</Collapsible>
```

---

#### 2. QuickBooksIntegration.tsx - Resizable Pending Area

**Add state for height:**
```typescript
const [pendingAreaHeight, setPendingAreaHeight] = useState(400);
const [isDragging, setIsDragging] = useState(false);
```

**Replace the fixed max-height div with a resizable container:**
```tsx
<div 
  className="relative overflow-y-auto space-y-3"
  style={{ maxHeight: `${pendingAreaHeight}px` }}
>
  {groupedPendingExpenses.map((expenseGroup) => (
    <GroupedPendingExpenseCard ... />
  ))}
</div>

{/* Resize Handle */}
<div
  className="h-4 flex items-center justify-center cursor-ns-resize hover:bg-muted/30 transition-colors group"
  onMouseDown={handleDragStart}
  onTouchStart={handleTouchStart}
>
  <div className="w-12 h-1 rounded-full bg-border group-hover:bg-muted-foreground/50 transition-colors" />
</div>
```

**Add resize handlers:**
```typescript
const handleDragStart = (e: React.MouseEvent) => {
  e.preventDefault();
  setIsDragging(true);
  const startY = e.clientY;
  const startHeight = pendingAreaHeight;
  
  const handleMouseMove = (moveEvent: MouseEvent) => {
    const delta = moveEvent.clientY - startY;
    const newHeight = Math.max(150, Math.min(800, startHeight + delta));
    setPendingAreaHeight(newHeight);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleTouchStart = (e: React.TouchEvent) => {
  const startY = e.touches[0].clientY;
  const startHeight = pendingAreaHeight;
  
  const handleTouchMove = (moveEvent: TouchEvent) => {
    const delta = moveEvent.touches[0].clientY - startY;
    const newHeight = Math.max(150, Math.min(800, startHeight + delta));
    setPendingAreaHeight(newHeight);
  };
  
  const handleTouchEnd = () => {
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
  
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', handleTouchEnd);
};
```

---

### Height Constraints

| Constraint | Value |
|------------|-------|
| Minimum height | 150px |
| Default height | 400px |
| Maximum height | 800px |

---

### User Flow

**Expenses Table:**
1. Table shows expanded by default with header showing count and total
2. User clicks header to collapse the table
3. Collapsed state still shows count and total for quick reference
4. Click again to expand

**QuickBooks Pending Area:**
1. Area defaults to 400px height (current behavior)
2. User sees a horizontal drag handle bar at the bottom of the pending list
3. Drag the handle up to shrink, down to expand
4. Min 150px, max 800px
5. Works with both mouse and touch

---

### Files to Modify

| File | Key Changes |
|------|-------------|
| `src/pages/Expenses.tsx` | Add `ChevronDown` import, Collapsible imports, `expensesTableOpen` state, wrap table section with Collapsible |
| `src/components/QuickBooksIntegration.tsx` | Add `pendingAreaHeight` state, replace fixed `max-h-[400px]` with dynamic height, add drag handle with mouse/touch event handlers |

