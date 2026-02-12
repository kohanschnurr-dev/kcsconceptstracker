

## Fix CSV Bulk Import Not Processing Files

### Root Cause
The `processCSV` function in `ImportExpensesModal.tsx` maps the amount column by looking for a header named exactly `"amount"`. However, the project's own CSV schema (used in the AI prompt and exports) uses `"Total"` as the column name. When the header check fails, the function calls `toast.error(...)` and silently returns -- making it look like nothing happened.

### Changes

**File: `src/components/project/ImportExpensesModal.tsx`**

1. **Expand the amount column aliases** (line ~277): Add `"total"` as a recognized alias alongside `"amount"`, so CSVs with either header work:
   ```ts
   amount: Math.max(header.indexOf('amount'), header.indexOf('total')),
   ```

2. **Add more header aliases for robustness**:
   - `"type"` is already handled for expense type -- good.
   - Add `"payment"` as alias for payment method column.

3. **Add console.log for debugging** (temporary, in `processCSV`): Log the detected header and column map so if issues persist, they'll show in the console for diagnosis.

4. **Make the error toast more descriptive**: When required columns are missing, include which columns were detected vs. which are missing, so the user knows exactly what to fix in their CSV.

### Files Modified
- `src/components/project/ImportExpensesModal.tsx`

