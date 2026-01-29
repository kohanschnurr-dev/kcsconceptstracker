
## Fix Amazon Price Extraction

The scraper is incorrectly extracting `$10` from Amazon product pages instead of the actual product price. This happens because:

1. The current price extraction uses a simple regex that grabs the **first dollar amount** found in the markdown
2. Amazon pages contain many prices (coupons, delivery fees, other products) before the actual product price
3. The `$10` is likely from a delivery fee or coupon that appears early in the page content

---

## Solution

Improve the Amazon-specific price extraction in the edge function by:

1. **Add Amazon-specific price patterns** that target known price element structures
2. **Look for product price context** (e.g., "Price:", main price container patterns)
3. **Filter out common false positives** like delivery fees, coupon amounts
4. **Use multiple price candidates** and select the most likely product price based on:
   - Position in the page (main content area)
   - Context keywords
   - Reasonable price range for the product category

---

## Technical Changes

**File: `supabase/functions/scrape-product-url/index.ts`**

### 1. Add Amazon-specific HTML price extraction (new function)

Add a function to extract prices from HTML specifically for Amazon:
- Target Amazon's known price element patterns (e.g., `apexPriceToPay`, `corePrice_feature_div`)
- Look for `data-a-color="price"` attributes
- Parse the price span structures Amazon uses

### 2. Update extractProductData function

For Amazon products:
- First try HTML-based price extraction (more reliable)
- Fall back to markdown extraction with better filtering
- Skip prices under $5 as likely delivery/add-on prices
- Look for prices near keywords like "current price", "with coupon", "list price"

### 3. Add price sanity checks

- If multiple prices found, prefer ones in reasonable range for product type
- Ignore prices that are suspiciously low (under $5 for most products)
- Use the crossed-out "list price" as a validation check

---

## Code Changes Summary

```text
Lines 185-198: Replace simple price extraction with:
├── Amazon-specific HTML price extraction function
├── Context-aware markdown price parsing
├── Filter for delivery fees ($5.99, $10.00 common values)
└── Price validation against scraped specs
```

The specs object already contains price hints like `"$179.99$179.99": "$149.99$149.99"` which can be used as validation.

---

## Expected Outcome

- Amazon products will show correct product prices (e.g., $179.99) instead of $10.00
- No changes to Home Depot, Lowe's, or other store price extraction
- Backwards compatible - won't break existing items
