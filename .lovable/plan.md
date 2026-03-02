

## Fix: Apply Discount Lines to Their Associated Items

### Problem
Home Depot "Pro Member Pricing", "INSTANT SAVINGS", and similar discount lines appear as separate negative-amount entries on the receipt. Currently these either show up as broken line items or get stripped generically. They should be applied to the specific item they belong to -- reducing that item's `total_price` and populating its `discount` field.

### How Receipt Discounts Work
On Home Depot/Lowe's receipts, a discount line always appears directly **below** the item it applies to:

```text
ROMEX 12/2 NM Wire 250ft    1   $89.97        $89.97
  PRO XTRA SAVINGS                           -$13.50
PVC Cement 8oz               1    $6.48         $6.48
```

The `-$13.50` applies to the ROMEX wire above it.

### Changes

**File: `supabase/functions/parse-receipt-image/index.ts`**

#### 1. Update AI Prompt -- Instruct to Fold Discounts Into Items

Add a new section to the system prompt explaining how to handle discount/savings lines:

```
DISCOUNT / SAVINGS LINES (Pro Xtra, Instant Savings, Coupons):
- These lines appear BELOW the item they apply to (e.g., "PRO XTRA SAVINGS -$13.50")
- Do NOT create separate line items for discounts
- Instead, SUBTRACT the discount from the item ABOVE it:
  - Reduce that item's total_price by the discount amount
  - Recalculate unit_price = total_price / quantity
  - Set that item's "discount" field to the absolute discount value
- Example: Wire $89.97 followed by "PRO SAVINGS -$13.50" becomes:
  { "item_name": "ROMEX 12/2 NM Wire 250ft", "total_price": 76.47, "discount": 13.50, "unit_price": 76.47 }
- Sum all discounts into "discount_amount" at the top level too
```

Also update the example JSON in the user prompt to show a discount field with a non-zero value.

#### 2. Add Post-Processing: Merge Negative Lines Into Prior Item

Even with prompt guidance, the AI may still return negative line items. Add a server-side pass (after `cleanedData` construction, before quantity validation) that:

1. Iterates through line items in order
2. If an item has `total_price < 0` or `unit_price < 0`, it's a discount line
3. Apply its absolute value to the **previous** item's `discount` field and reduce that item's `total_price`
4. Recalculate the previous item's `unit_price`
5. Remove the discount line from the array
6. Accumulate all found discounts into `cleanedData.discount_amount`

```typescript
// Merge negative/discount lines into the item they follow
const mergedItems: typeof cleanedData.line_items = [];
let accumulatedDiscount = 0;

for (let i = 0; i < cleanedData.line_items.length; i++) {
  const item = cleanedData.line_items[i];
  if (item.total_price < 0 || item.unit_price < 0) {
    // This is a discount line -- apply to previous item
    const discountAmt = Math.abs(item.total_price);
    accumulatedDiscount += discountAmt;
    if (mergedItems.length > 0) {
      const prev = mergedItems[mergedItems.length - 1];
      prev.discount = Math.round((prev.discount + discountAmt) * 100) / 100;
      prev.total_price = Math.round((prev.total_price - discountAmt) * 100) / 100;
      prev.unit_price = prev.quantity > 0
        ? Math.round((prev.total_price / prev.quantity) * 100) / 100
        : prev.total_price;
    }
  } else {
    mergedItems.push({ ...item });
  }
}

cleanedData.line_items = mergedItems;
cleanedData.discount_amount += Math.round(accumulatedDiscount * 100) / 100;
```

This ensures every discount is attributed to the correct product rather than floating as a separate broken entry.

### Summary

| File | Change |
|------|--------|
| `supabase/functions/parse-receipt-image/index.ts` | Update prompt to fold discounts into items + add post-processing merge for negative lines |

