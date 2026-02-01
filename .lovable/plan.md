

## Plan: Remove TX Sales Tax Section from Expenses Summary

### Overview

Remove the "TX Sales Tax (8.25%)" display from the right side of the expenses summary card.

---

### Technical Implementation

**File: `src/pages/Expenses.tsx`**

Remove lines 474-479 which contain the tax display:

```tsx
// BEFORE (lines 459-480):
<div className="glass-card p-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <Receipt className="h-5 w-5 text-primary" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground">
        {filteredExpenses.length} expenses
      </p>
      <p className="text-xl font-semibold font-mono">
        {formatCurrency(totalExpenses)}
      </p>
    </div>
  </div>
  <div className="text-right text-sm text-muted-foreground">      // ← REMOVE
    <p>TX Sales Tax (8.25%)</p>                                    // ← REMOVE
    <p className="font-mono text-foreground">                      // ← REMOVE
      {formatCurrency(...)}                                        // ← REMOVE
    </p>                                                           // ← REMOVE
  </div>                                                           // ← REMOVE
</div>

// AFTER:
<div className="glass-card p-4">
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <Receipt className="h-5 w-5 text-primary" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground">
        {filteredExpenses.length} expenses
      </p>
      <p className="text-xl font-semibold font-mono">
        {formatCurrency(totalExpenses)}
      </p>
    </div>
  </div>
</div>
```

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/pages/Expenses.tsx` | Remove TX Sales Tax section (lines 474-479), simplify card layout |

---

### Result

The summary card will show only the expense count and total amount, without the Texas Sales Tax information on the right side.

