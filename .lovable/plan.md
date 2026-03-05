

## Apply Local Date Fix to Invoice & Scope of Work Generators

Same fix as the receipt generator — replace `new Date().toISOString().split('T')[0]` with `formatDateString(new Date())` to prevent the off-by-one day error in US timezones.

### 1. `src/components/project/GenerateInvoiceSheet.tsx`
- Add import: `import { formatDateString } from '@/lib/dateUtils'`
- Line 69: initial `invoiceDate` state → `formatDateString(new Date())`
- Line 94: reset `invoiceDate` in `handleOpenChange` → `formatDateString(new Date())`

### 2. `src/components/vendors/ScopeOfWorkSheet.tsx`
- Add import: `import { formatDateString } from '@/lib/dateUtils'`
- Line 54: initial `date` state → `formatDateString(new Date())`
- Line 77: reset `date` in `handleOpenChange` → `formatDateString(new Date())`

Two files, four replacements total. No other changes needed.

