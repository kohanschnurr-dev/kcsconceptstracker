

## Plan: Fix Column Alignment in Expenses Table

### The Issue

Looking at the screenshot, the columns are visually misaligned because:
1. The base `.data-table th` CSS applies `text-left` by default
2. The inline `text-center` classes may not be overriding properly due to CSS specificity
3. The column widths may be inconsistent between header and body cells

---

### Solution

Fix the alignment by using proper CSS classes with higher specificity and ensuring consistent column widths.

---

### Technical Implementation

**File: `src/pages/Expenses.tsx`**

Update the table headers to use `!text-center` (Tailwind's important modifier) to override the base CSS:

```tsx
<thead>
  <tr className="bg-muted/30">
    <th className="w-[100px]">Date</th>
    <th>Vendor</th>
    <th className="!text-center">Project</th>
    <th className="!text-center">Category</th>
    <th className="!text-center">Payment</th>
    <th className="!text-center">Amount</th>
  </tr>
</thead>
```

**File: `src/components/expenses/GroupedExpenseRow.tsx`**

Update all `<td>` elements to use `!text-center` for the centered columns:

For single expense rows:
```tsx
<td className="!text-center">{getProjectName(expense.project_id)}</td>
<td className="!text-center">
  <Badge ...>...</Badge>
</td>
<td className="!text-center capitalize">{expense.payment_method}</td>
<td className="!text-center">
  <div className="flex items-center justify-center gap-2">...</div>
</td>
```

For parent (grouped) rows:
```tsx
<td className="!text-center">{getProjectName(parentExpense.project_id)}</td>
<td className="!text-center">
  <Badge ...>Multiple</Badge>
</td>
<td className="!text-center capitalize">{parentExpense.payment_method}</td>
<td className="!text-center">
  <div className="flex items-center justify-center gap-2">...</div>
</td>
```

For child (expanded) rows:
```tsx
<td className="!text-center text-muted-foreground text-sm">—</td>
<td className="!text-center">
  <Badge ...>...</Badge>
</td>
<td className="!text-center text-muted-foreground text-sm">—</td>
<td className="!text-center">
  <div className="flex items-center justify-center gap-2">...</div>
</td>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Expenses.tsx` | Add `!text-center` to `<th>` elements for Project, Category, Payment, Amount |
| `src/components/expenses/GroupedExpenseRow.tsx` | Add `!text-center` to all corresponding `<td>` elements |

---

### Why This Works

The `!` prefix in Tailwind (e.g., `!text-center`) applies `!important` to the CSS rule, ensuring it overrides the base `.data-table th { text-align: left }` style defined in `src/index.css`.

