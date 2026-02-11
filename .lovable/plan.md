

## Remove "Attach Receipt to Expense" and "Beta" Badge

### Changes

**1. Remove "Attach Receipt to Expense" from Business Expenses page**
- **File: `src/pages/BusinessExpenses.tsx`** (~lines 582-585): Remove the `<BusinessReceiptUpload>` component usage and its import.

**2. Remove the `BusinessReceiptUpload` component file**
- **File: `src/components/BusinessReceiptUpload.tsx`**: Delete this file entirely since it's no longer used anywhere.

**3. Remove "Beta" badge from SmartSplit on Business Expenses page**
- **File: `src/components/SmartSplitReceiptUpload.tsx`** (lines 997-999): Remove the `<Badge>Beta</Badge>` element from the SmartSplit header.

**4. Remove "Beta" badge from SmartSplit on Expenses page**
- Same file handles both pages, so change #3 covers the Expenses page as well since `SmartSplitReceiptUpload` is shared by both `QuickBooksIntegration.tsx` and `BusinessQuickBooksIntegration.tsx`.

