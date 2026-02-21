

## Add Sales Tax Toggle Integration with Receipt Breakdown

### What Changes

Currently, when the AI parses a receipt, it might return "Tax" or "Sales Tax" as a line-item category in the breakdown. Since tax is already handled by the dedicated toggle switch, these tax line items should be filtered out of the breakdown and instead auto-enable the toggle.

### Changes to `src/components/QuickExpenseModal.tsx`

**1. Filter tax line items out of the breakdown**

When populating `parsedLineItems` from the AI parse result, filter out any items where the `item_name` or `suggested_category` matches tax-related terms (e.g., "tax", "sales tax", "TX tax"). This prevents tax from appearing as a category row in the Receipt Breakdown.

**2. Auto-enable the tax toggle when tax is detected**

In `handleParseReceiptImage`, if the parsed result includes a `tax_amount > 0`, automatically turn on the `includeTax` toggle (currently line 212 sets it to `false`, which is incorrect -- it should be `true`).

**3. Use the receipt's subtotal (not total) as the Amount field when tax is detected**

When the AI returns both `subtotal` and `tax_amount`, set the Amount field to the `subtotal` value so the tax toggle can correctly add the tax on top. This avoids double-counting tax.

**4. Fix line 212 bug**

Change `setIncludeTax(false)` to `setIncludeTax(true)` when `parsed.tax_amount > 0` -- the current logic is backwards.

### Technical Details

**Tax line-item filter (in handleParseReceiptImage):**
```typescript
const taxPatterns = /^(sales\s*)?tax$/i;
const nonTaxItems = parsed.line_items.filter(
  (li) => !taxPatterns.test(li.item_name?.trim()) && !taxPatterns.test(li.suggested_category?.trim())
);
// Use nonTaxItems instead of parsed.line_items for setParsedLineItems
```

**Fix tax auto-detection:**
```typescript
// Line 212: change from false to true
if (parsed.tax_amount && parsed.tax_amount > 0) {
  setIncludeTax(true);
  // Use subtotal as the base amount if available
  if (parsed.subtotal) setAmount(parsed.subtotal.toString());
}
```

### Files Changed
- `src/components/QuickExpenseModal.tsx` -- filter tax from line items, fix tax toggle auto-enable, use subtotal when tax detected
