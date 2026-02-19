

## Add "Financed" Payment Method

### What Changes

The `payment_method` database enum currently only has 4 values: `cash`, `check`, `card`, `transfer`. To add "Financed" as an option, we need a database migration and then update every UI dropdown that renders these options.

### Step 1: Database Migration

Add `financed` to the `payment_method` enum:

```sql
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'financed';
```

### Step 2: Update TypeScript Type

In `src/types/index.ts`, update the `PaymentMethod` type:

```
'cash' | 'check' | 'card' | 'transfer' | 'financed'
```

### Step 3: Add "Financed" to All Payment Dropdowns

There are 4 files with payment method `<Select>` dropdowns that need the new option added:

| File | Context |
|---|---|
| `src/components/QuickExpenseModal.tsx` (line 310) | Add Expense modal |
| `src/components/project/ExpenseActions.tsx` (line 211) | Edit expense inline |
| `src/pages/ProjectBudget.tsx` (line 1298) | Budget filter dropdown (add after "Transfer") |
| `src/pages/BusinessExpenses.tsx` (line 945) | Business expense form |

Each gets a new line:
```
<SelectItem value="financed">Financed</SelectItem>
```

Note: `GenerateReceiptSheet.tsx` and `GenerateInvoiceSheet.tsx` use freeform payment labels (Check, Wire Transfer, Zelle, etc.) -- those are separate from the enum and don't need this change.

### Files Changed

- 1 new migration file (ALTER TYPE)
- `src/types/index.ts` -- add `'financed'` to union type
- `src/components/QuickExpenseModal.tsx` -- add SelectItem
- `src/components/project/ExpenseActions.tsx` -- add SelectItem
- `src/pages/ProjectBudget.tsx` -- add SelectItem
- `src/pages/BusinessExpenses.tsx` -- add SelectItem

6 small edits total. No new dependencies, no new files beyond the migration.

