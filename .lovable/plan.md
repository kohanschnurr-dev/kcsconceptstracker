

## Remove Subtotal from Invoice PDF Output

### Problem
The generated Invoice PDF currently shows SUBTOTAL, then TAX, then TOTAL DUE. This is misleading because users see a number (subtotal), then tax is added after, making the final total unexpected. The user wants to remove the subtotal line entirely and just show tax followed by the grand total.

### Changes

**`src/components/project/GenerateInvoiceSheet.tsx`** (2 areas)

1. **PDF text output** (line ~164): Remove the `SUBTOTAL:` line from the generated text content. Keep TAX and rename to just `TOTAL:` (drop "DUE"):
   - Before: SUBTOTAL → TAX → TOTAL DUE
   - After: TAX → TOTAL

2. **UI preview summary** (lines 339-363): Remove the "Subtotal" row from the in-sheet summary. Show only:
   - Tax (with the percentage input)
   - Total (bold, with border-top)

No changes needed to `GenerateReceiptSheet.tsx` (it already shows just "TOTAL PAID" with no subtotal) or `ScopeOfWorkSheet.tsx` (its subtotal is per-section, different context).

