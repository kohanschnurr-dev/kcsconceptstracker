

## Fix Date Off-by-One in Receipt Generator

The receipt generator uses `new Date().toISOString().split('T')[0]` to set default dates. Since `toISOString()` returns UTC, users in US timezones (CST/EST/PST) see tomorrow's date after their local evening hours.

### Fix in `src/components/project/GenerateReceiptSheet.tsx`

- Import `formatDateString` from `@/lib/dateUtils`
- Replace all 3 occurrences of `new Date().toISOString().split('T')[0]` with `formatDateString(new Date())`:
  1. Initial `receiptDate` state (line ~68)
  2. Initial `paymentDate` state (line ~72)
  3. Reset in `handleOpenChange` for `receiptDate` (line ~82)
  4. Reset in `handleOpenChange` for `paymentDate` (line ~86)

Single file change.

