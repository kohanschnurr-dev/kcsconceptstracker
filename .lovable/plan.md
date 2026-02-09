

## Replace Loan Button with "More" Popover (Loan + Utilities)

### Overview

Replace the standalone "Loan" button with a small icon-only button (e.g., `MoreHorizontal` or `Ellipsis` icon) that opens a popover/dropdown containing "Loan" and "Utilities" as selectable expense types. This keeps the main row clean since these types are used less frequently than Product/Labor.

### Changes

**1. `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**

- Add imports: `MoreHorizontal`, `Zap` (for utilities icon) from lucide-react, and `Popover`/`PopoverTrigger`/`PopoverContent` from radix
- Update `selectedExpenseType` type from `'product' | 'labor' | 'loan'` to `'product' | 'labor' | 'loan' | 'utilities'`
- Remove the standalone "Loan" `Button` (lines 255-270)
- Add a new icon-only `Button` with `MoreHorizontal` icon that triggers a `Popover`
- Inside the popover, show two clickable rows:
  - **Loan** (Landmark icon) -- sets type to `'loan'`, closes popover, hides category dropdown
  - **Utilities** (Zap icon) -- sets type to `'utilities'`, closes popover, keeps category dropdown visible
- When either is active, show a small badge/indicator near the "more" button so the user knows a special type is selected (e.g., the button gets a colored border/background)
- Clicking Product or Labor in the ToggleGroup clears any "more" selection back to normal
- Hide category dropdown when type is `'loan'` (already implemented) but keep it for `'utilities'`
- Hide the Product/Labor toggle when `'loan'` is selected (already implemented), but show it when `'utilities'` is selected

**2. `src/hooks/useQuickBooks.ts`**

- Update `categorizeExpense` to accept `'utilities'` as an expense type
- Utilities behaves like product/labor (needs category, goes into budget) -- no special loan_payments logic
- The `expense_type` field stores `'utilities'` for reporting/filtering purposes

**3. Type updates in `onCategorize` prop**

- Update the type signature in `GroupedPendingExpenseCardProps` and `QuickBooksIntegration.tsx` to accept `'utilities'` alongside the existing types

### UI Behavior

The action row will look like:

```
[...] [Split] [Product] [Labor] [check]
```

Where `[...]` is a small icon button. Tapping it opens a popover:

```
+------------------+
| Loan        (icon)|
| Utilities   (icon)|
+------------------+
```

When Loan or Utilities is selected, the `[...]` button gets a highlight (colored border) and the selected type name appears as a small label next to it. Clicking Product or Labor deselects the "more" option.

### Technical Details

- Uses existing `Popover` component from `@/components/ui/popover`
- No database changes needed -- `expense_type` column is text and already accepts any string
- Utilities expenses follow the normal category + budget flow, unlike loans which skip category

