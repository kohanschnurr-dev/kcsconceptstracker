

## Use Dynamic Expense Categories for Vendor Trades

### Problem
The "Edit Contractor" modal uses the static `VENDOR_TRADES` constant, which only contains the hardcoded default categories. Custom categories added in Settings (like "Architect") don't appear in the trades dropdown.

### Fix
**File: `src/components/NewVendorModal.tsx`**

1. Change the import from `VENDOR_TRADES` to `getVendorTrades` (the dynamic function that reads custom categories from localStorage)
2. Replace all 3 usages of `VENDOR_TRADES` with `getVendorTrades()`:
   - `getTradeLabel` lookup (line 93)
   - `availableTrades` filter (line 96)
   - The import statement (line 21)

This ensures the trades dropdown always reflects the current expense categories list, including any custom ones added through Settings.

