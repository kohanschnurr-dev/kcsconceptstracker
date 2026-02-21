

## Cleaner Error Indicator for Import Rows

### Problem

The error badge currently shows text like "Invalid amount" or "Invalid date" which takes up space. Replace these with a compact red "!" icon for a cleaner look.

### Changes

**`src/lib/csvImportUtils.ts`** -- Remove the `errorMsg` string assignments. Keep the `hasError` boolean flag but stop setting descriptive text:

- Line 180: `if (!parsedDate) { hasError = true; }`
- Line 181: `if (isNaN(amount)) { hasError = true; }`

**`src/components/project/ImportExpensesModal.tsx`** -- In the Status column, replace the destructive Badge with a red `AlertTriangle` or `AlertCircle` icon:

```tsx
// Before
{row.hasError ? (<Badge variant="destructive" className="text-xs">{row.errorMsg}</Badge>)

// After
{row.hasError ? (<AlertTriangle className="h-4 w-4 text-destructive" />)
```

Also update the inline-editing condition checks -- currently they check `row.errorMsg?.toLowerCase().includes('date')` and `row.errorMsg?.toLowerCase().includes('amount')`. Since we're removing errorMsg text, switch to detecting the error source directly: show the date input when `row.hasError && !row.date` or the date is unparseable, and the amount input when `row.hasError && isNaN(row.amount)`.

**`src/components/QuickExpenseModal.tsx`** -- Same status column and inline-editing changes.

### Files Changed
- `src/lib/csvImportUtils.ts` -- remove errorMsg strings, keep hasError boolean
- `src/components/project/ImportExpensesModal.tsx` -- red icon instead of text badge, update edit detection
- `src/components/QuickExpenseModal.tsx` -- same changes

