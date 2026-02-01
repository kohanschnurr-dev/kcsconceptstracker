

## Plan: Fix Home Depot URL Scraping with Firecrawl Enhanced Mode

### Problem Analysis

The Home Depot product URL scraping is failing with `SCRAPE_TIMEOUT` errors. This is happening because:

1. Home Depot has aggressive anti-bot protection
2. Heavy JavaScript rendering that requires more time
3. The current implementation uses basic Firecrawl settings without proxy enhancement

### Solution

Use Firecrawl's **Enhanced Mode** with the `proxy: "auto"` parameter. This automatically retries with enhanced proxies when basic scraping fails, which is designed for complex sites like Home Depot.

Additionally, add the `actions` parameter to scroll the page, which ensures all JavaScript content loads before extraction.

---

### Technical Implementation

**File: `supabase/functions/scrape-product-url/index.ts`**

**1. Update the Firecrawl API call (lines 696-713)**

Add `proxy` parameter and `actions` for difficult sites:

```typescript
// Use Firecrawl to scrape the page
const store = detectStore(formattedUrl);
const needsEnhancedMode = store === 'home_depot' || store === 'lowes';

const scrapeOptions: any = {
  url: formattedUrl,
  formats: ['markdown', 'html'],
  onlyMainContent: false,
  waitFor: needsEnhancedMode ? 5000 : 3000,
  timeout: needsEnhancedMode ? 90000 : 30000,
  location: {
    country: 'US',
    languages: ['en'],
  },
};

// Use enhanced proxy for sites with anti-bot protection
if (needsEnhancedMode) {
  scrapeOptions.proxy = 'enhanced';
  // Add actions to wait and scroll for JS content to load
  scrapeOptions.actions = [
    { type: 'wait', milliseconds: 2000 },
    { type: 'scroll', direction: 'down' },
    { type: 'wait', milliseconds: 2000 },
  ];
}

const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(scrapeOptions),
});
```

---

### Changes Summary

| Location | Change |
|----------|--------|
| Lines 693-713 | Add `proxy: "enhanced"` for HD/Lowe's |
| Lines 693-713 | Add scroll/wait actions to load dynamic content |
| Lines 693-713 | Increase timeout to 90 seconds for enhanced mode |

---

### How Enhanced Mode Helps

1. **Enhanced Proxy**: Uses specialized proxies designed to bypass anti-bot protection (costs 5 credits instead of 1)
2. **Actions**: Scrolling the page triggers lazy-loaded content to render
3. **Wait Time**: Additional waits allow JavaScript to fully execute

---

### Alternative: Fallback Mechanism

If enhanced mode still fails occasionally, we could implement a fallback:
- First attempt with basic mode
- If timeout/error, retry with enhanced mode
- This optimizes credit usage for sites that don't need enhancement

---

### Expected Result

- Home Depot product URLs should scrape successfully
- Product name, price, image, and specs will be extracted
- Lowe's and other difficult sites will also benefit from this change

