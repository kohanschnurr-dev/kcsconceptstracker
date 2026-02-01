
## Plan: Move Chevron to Right of Date

### Overview

Move the dropdown chevron arrow from the left side of the date to the right side, so all dates remain left-aligned regardless of whether a row is expandable or not.

---

### Current Layout

```
> Jan 29, 2026   ← chevron on left, date shifted right
  Jan 28, 2026   ← no chevron, date at normal position
```

### Target Layout

```
Jan 29, 2026 >   ← date at left, chevron on right
Jan 28, 2026     ← no chevron, date at same position
```

---

### Technical Implementation

**File: `src/components/expenses/GroupedExpenseRow.tsx`**

Update the parent row's date cell (lines 123-132) to place the chevron after the date instead of before:

```tsx
// BEFORE:
<td className="whitespace-nowrap">
  <div className="flex items-center gap-1">
    {isExpanded ? (
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    ) : (
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    )}
    {formatDisplayDate(parentExpense.date)}
  </div>
</td>

// AFTER:
<td className="whitespace-nowrap">
  <div className="flex items-center gap-1">
    {formatDisplayDate(parentExpense.date)}
    {isExpanded ? (
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    ) : (
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    )}
  </div>
</td>
```

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/expenses/GroupedExpenseRow.tsx` | Swap order of chevron and date text in parent row (lines 123-132) |

---

### Result

All dates will be left-aligned at the same position. Expandable rows will show the chevron arrow to the right of the date, providing a consistent visual alignment across all expense rows.
