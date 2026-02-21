

## Show Trash Button Only on Error Rows

### Problem

The trash (remove) button currently appears on every row in the CSV import preview. It should only show on rows that have errors or need attention, since those are the ones users would want to discard.

### Changes

#### 1. `src/components/project/ImportExpensesModal.tsx`

In the last `<TableCell>` of each row, conditionally render the trash button only when `row.hasError || !row.matchedCategory`:

```tsx
<TableCell>
  {(row.hasError || !row.matchedCategory) && (
    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeRow(row.originalIdx)}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )}
</TableCell>
```

#### 2. `src/components/QuickExpenseModal.tsx`

Same conditional logic in the ImportTab's preview table -- only show the trash button on rows with errors or unmatched categories.

### Files Changed
- `src/components/project/ImportExpensesModal.tsx` -- conditional trash button
- `src/components/QuickExpenseModal.tsx` -- conditional trash button

