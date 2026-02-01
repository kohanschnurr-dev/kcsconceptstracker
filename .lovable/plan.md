
## Plan: Fix Home Depot Price Extraction Using Embedded JSON Data

### Problem Analysis

The current implementation tries to scrape Home Depot pages using Firecrawl with stealth mode, but:
1. The pages are heavily JavaScript-rendered and anti-bot protected
2. Even when we get the HTML, the current price extraction logic doesn't have Home Depot-specific patterns
3. Home Depot embeds **structured JSON data** in the page that contains clean, reliable price information

### Solution

Add **Home Depot-specific price extraction** that parses the embedded JSON data from the page HTML. This JSON contains:
```json
{
  "itemId": "301688589",
  "pricing": {
    "value": 31.97,
    "original": 31.97
  }
}
```

This approach is much more reliable than trying to parse dynamic CSS selectors.

---

### Technical Implementation

**File: `supabase/functions/scrape-product-url/index.ts`**

**1. Add new Home Depot price extraction function (after line 291)**

```typescript
// Home Depot-specific price extraction from embedded JSON
function extractHomeDepotPrice(html: string): number | null {
  // Look for embedded JSON pricing data
  const patterns = [
    // Embedded product JSON with pricing
    /"pricing"\s*:\s*\{\s*"value"\s*:\s*([\d.]+)/i,
    /"pricing":\{"value":([\d.]+)/i,
    // Price format patterns
    /"price"\s*:\s*([\d.]+)/i,
    // Data attributes
    /data-price="([\d.]+)"/i,
    // Price display classes  
    /class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i,
    /price-format__main-price[^>]*>\s*\$?([\d,]+\.?\d*)/i,
    /price__dollars[^>]*>([\d,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price && price > 0 && price < 50000) {
        console.log('Found Home Depot price via pattern:', pattern.toString().slice(0, 50));
        return price;
      }
    }
  }
  
  return null;
}
```

**2. Update extractProductData function (around line 497)**

Add Home Depot price extraction before the markdown fallback:
```typescript
// Extract price - use store-specific logic
if (store === 'amazon') {
  // Try HTML extraction first for Amazon (more reliable)
  price = extractAmazonPrice(html);
  
  // Fall back to markdown extraction
  if (!price) {
    price = extractPriceFromMarkdown(markdown, store);
  }
} else if (store === 'home_depot') {
  // Try embedded JSON extraction first for Home Depot
  price = extractHomeDepotPrice(html);
  
  // Fall back to markdown extraction
  if (!price) {
    price = extractPriceFromMarkdown(markdown, store);
  }
} else if (store === 'lowes') {
  // Similar pattern for Lowe's
  price = extractLowesPrice(html);
  
  if (!price) {
    price = extractPriceFromMarkdown(markdown, store);
  }
} else {
  // For other stores, use markdown extraction
  price = extractPriceFromMarkdown(markdown, store);
}
```

**3. Add Lowe's price extraction function**

```typescript
// Lowe's-specific price extraction from embedded JSON
function extractLowesPrice(html: string): number | null {
  const patterns = [
    /"price"\s*:\s*\{\s*"value"\s*:\s*([\d.]+)/i,
    /"sellingPrice"\s*:\s*([\d.]+)/i,
    /data-price="([\d.]+)"/i,
    /class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price && price > 0 && price < 50000) {
        return price;
      }
    }
  }
  
  return null;
}
```

---

### Changes Summary

| Location | Change |
|----------|--------|
| After line 291 | Add `extractHomeDepotPrice()` function |
| After line 291 | Add `extractLowesPrice()` function |
| Lines 488-500 | Update price extraction to use store-specific functions |

---

### Why This Works

1. **Embedded JSON is reliable**: Home Depot pages contain structured product data as JSON, which is used by their own JavaScript
2. **Multiple fallback patterns**: We try several patterns to catch the price data
3. **No anti-bot issues**: Once we have the HTML (even partial), the JSON patterns can extract the price
4. **Maintains existing fallback**: If JSON extraction fails, we still try markdown patterns

---

### Expected Result

- Home Depot prices will be extracted from embedded JSON data
- Works even when page JavaScript doesn't fully render
- Lowe's products will also benefit from similar extraction
- Price extraction becomes much more reliable for major retailers
