
## Handle Negative Expenses (Refunds) in CSV Import

### Problem

The CSV parser rejects any row with a negative amount (`amount <= 0` is flagged as "Invalid amount"). In reality, negative values represent refunds and should be imported normally.

### Changes

#### 1. `src/lib/csvImportUtils.ts` -- Allow negative amounts

**Line 181**: Change the validation from `amount <= 0` to just `amount === 0` (or keep only `isNaN`), so negative values pass through:

```typescript
// Before
if (isNaN(amount) || amount <= 0) { hasError = true; errorMsg = 'Invalid amount'; }

// After
if (isNaN(amount) || amount === 0) { hasError = true; errorMsg = 'Invalid amount'; }
```

**Line 188**: Keep `Math.abs` off -- store the raw negative value so the database reflects the refund correctly.

#### 2. `src/components/project/ImportExpensesModal.tsx` -- Visual refund indicator

In the preview table's Amount cell, show negative values in green with a "Refund" badge so they stand out:

```tsx
<TableCell className="text-right font-mono text-sm">
  {row.amount < 0 ? (
    <span className="text-success">-${Math.abs(row.amount).toLocaleString(...)}</span>
  ) : (
    <span>${row.amount.toLocaleString(...)}</span>
  )}
</TableCell>
```

Also add a small "Refund" badge next to negative amounts in the Status column for extra clarity.

#### 3. `src/components/QuickExpenseModal.tsx` -- Same visual treatment

Mirror the same negative-amount display logic in the ImportTab's preview table.

#### 4. Sample CSV + AI Prompt (minor)

Update the AI prompt in `csvImportUtils.ts` to mention: "Use negative amounts to represent refunds or credits."

Add a refund example row to `downloadSampleCSV`:
```
2025-02-10,Home Depot,Flooring,Returned excess LVP,-320.00,card,product,Refund
```

### Files Changed
- `src/lib/csvImportUtils.ts` -- allow negative amounts in validation; update AI prompt and sample CSV
- `src/components/project/ImportExpensesModal.tsx` -- green styling and "Refund" badge for negative rows
- `src/components/QuickExpenseModal.tsx` -- same visual treatment in ImportTab
