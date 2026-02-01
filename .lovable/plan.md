
## Plan: Align QB Badges in Fixed Position

### Overview

Move the QuickBooks (QB) badge to a fixed position on the right side of the Vendor column, so all badges line up vertically regardless of vendor name length.

---

### Technical Implementation

**File: `src/components/expenses/GroupedExpenseRow.tsx`**

Change the vendor cell layout from inline flex to a flex container with `justify-between`, giving the vendor info and QB badge separate spaces:

**Single expense rows (lines 64-81):**
```tsx
// BEFORE:
<td>
  <div className="flex items-center gap-2">
    <div>
      <p className="font-medium">{expense.vendor_name || 'Unknown'}</p>
      ...
    </div>
    {expense.source === 'quickbooks' && (
      <Badge ...>QB</Badge>
    )}
  </div>
</td>

// AFTER:
<td>
  <div className="flex items-center justify-between gap-2">
    <div className="flex-1 min-w-0">
      <p className="font-medium">{expense.vendor_name || 'Unknown'}</p>
      ...
    </div>
    <div className="w-8 flex-shrink-0 flex justify-end">
      {expense.source === 'quickbooks' && (
        <Badge ...>QB</Badge>
      )}
    </div>
  </div>
</td>
```

**Parent (grouped) rows (lines 131-144):**
Apply the same pattern - use `justify-between` and a fixed-width container for the QB badge on the right.

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/expenses/GroupedExpenseRow.tsx` | Update vendor cell layout to use `justify-between` with fixed-width badge container |

---

### Result

All QB badges will appear in a fixed position on the right side of the Vendor column, creating a clean vertical alignment regardless of how long or short the vendor names are.
