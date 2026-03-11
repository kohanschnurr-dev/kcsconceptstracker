

## Plan: Fix Receipt Parsing — Return NET Prices Instead of Pre-Discount Prices

### Problem
The AI returns item prices at their **original** (pre-discount) values, then returns discount lines separately. The server-side discount merge is fragile — it assumes discounts always follow their product, but the AI doesn't always order them correctly. Result: line items total $225 when the actual subtotal is $140, a 60% mismatch that triggers bad proportional scaling.

### Solution
Restructure the AI prompt to return **net prices** (after discounts) per item, with discount metadata as extra fields. This moves discount attribution to the AI (which can see the receipt layout) instead of fragile server-side position-based merging.

### Changes

**File: `supabase/functions/parse-receipt-image/index.ts`**

1. **Rewrite the Pass 2 system prompt** to instruct the AI to:
   - Return each product's `total_price` as the **NET price after any discounts** applied to that item
   - Add `discount` (positive number) and `original_price` fields per item
   - Stop returning discount lines as separate items entirely
   - Example: Item $25.96 with Pro Xtra -$5.96 → `total_price: 20.00, discount: 5.96, original_price: 25.96`

2. **Remove server-side discount merging logic** (the `isDisc` branch in the products loop). Since the AI now returns net prices directly, no merging is needed.

3. **Keep deduplication and subtotal enforcement** as safety nets, but they should rarely trigger since the AI returns correct net prices.

4. **Include `discount` and `original_price` in the response** so the UI can display discount badges.

5. **Use `google/gemini-2.5-pro`** instead of `gemini-2.5-flash` for better accuracy on complex receipt layouts (Home Depot Pro receipts with multiple discount types).

### Updated AI Prompt (key change)

```
For each product line, return the FINAL price AFTER any discounts.
If a discount applies to an item, set:
- total_price = net price after discount
- discount = positive discount amount
- original_price = price before discount
Do NOT return discount lines as separate items.
```

### Updated server-side processing
- Remove the discount merge loop
- Keep dedup + subtotal enforcement as safety nets
- Pass through `discount` and `original_price` fields in response

