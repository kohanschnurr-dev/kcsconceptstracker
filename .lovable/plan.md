

## Make Error Rows Editable and Removable in CSV Import Preview

### What Changes

Add a remove (trash) button to every row in the import preview, and make error rows editable so users can fix issues inline rather than going back to re-upload. This applies to both the Project Budget import modal and the Quick Expense import tab.

### Changes

#### 1. Add a "Remove Row" button to every row

- Add an extra column to the table with a small trash/X icon button
- Clicking it removes that row from the `rows` array by index
- Add a `removeRow` helper: `setRows(prev => prev.filter((_, i) => i !== idx))`
- If all rows are removed, automatically go back to the upload step

#### 2. Make error rows inline-editable

For rows with `hasError` (e.g. "Invalid date", "Invalid amount"), replace the static error display with inline editing:

- **Date errors**: Show a small text input pre-filled with the raw date value so the user can correct the format
- **Amount errors**: Show a small text input pre-filled with the raw value so the user can fix it
- When the user edits and the value becomes valid, clear the error flags (`hasError = false`, `errorMsg = undefined`)
- Add `updateRowField` helper that updates a specific field and re-validates

#### 3. Update `canImport` logic

Currently import is blocked when `needsAttention.length > 0`. With the remove button, users can simply discard bad rows to unblock the import. No logic change needed -- removing rows naturally reduces `needsAttention`.

### Technical Detail

**New helpers in both modals:**

```tsx
const removeRow = (idx: number) => {
  setRows(prev => {
    const next = prev.filter((_, i) => i !== idx);
    if (next.length === 0) { setStep('upload'); }
    return next;
  });
};

const updateRowField = (idx: number, field: 'date' | 'amount', value: string) => {
  setRows(prev => prev.map((r, i) => {
    if (i !== idx) return r;
    const updated = { ...r };
    if (field === 'date') {
      updated.date = value;
      // Re-validate: try parsing as date
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        updated.hasError = false;
        updated.errorMsg = undefined;
      }
    }
    if (field === 'amount') {
      const num = parseFloat(value.replace(/[^0-9.\-]/g, ''));
      if (!isNaN(num)) {
        updated.amount = num;
        updated.hasError = false;
        updated.errorMsg = undefined;
      }
    }
    return updated;
  }));
};
```

**Table changes:**

- Add a narrow column header (empty or trash icon) at the end
- Each row gets a small ghost button with an X/Trash2 icon
- For error rows: the Date and Amount cells become small `<Input>` fields instead of plain text
- The error badge in the Status column stays visible until the value is corrected

**Import:** `lucide-react` already has `Trash2` and `X` icons; `Input` component from `@/components/ui/input` for inline editing.

### Files Changed
- `src/components/project/ImportExpensesModal.tsx` -- add removeRow, updateRowField, trash button column, inline editing for error rows
- `src/components/QuickExpenseModal.tsx` -- same changes in ImportTab's preview table
