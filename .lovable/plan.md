

## Plan: Fix Home Depot URL Scraping with Firecrawl v2 API and Stealth Mode

### Problem Analysis

The Home Depot product URL scraping is failing with `SCRAPE_TIMEOUT` errors despite using enhanced mode. Based on my investigation:

1. **Using outdated v1 API** - The code uses `https://api.firecrawl.dev/v1/scrape` but Firecrawl v2 is current and has better anti-bot handling
2. **Wrong proxy value** - Using `proxy: 'enhanced'` but for aggressive anti-bot sites, `proxy: 'stealth'` is the correct option
3. **Missing helpful options** - Not using `blockAds: true` and `mobile: false` which can improve scraping success
4. **Action syntax issues** - The scroll action syntax may need adjustment

From the Firecrawl documentation, there are **three proxy types**:
- `basic`: Fast, works for most sites
- `enhanced`: For complex sites with moderate anti-bot (5 credits)
- `stealth`: For sites with aggressive anti-bot protection like Home Depot (uses stealth proxies)

The default `auto` setting doesn't include `stealth` - it only falls back to `enhanced`.

---

### Solution

1. **Upgrade to Firecrawl v2 API** - Change endpoint from `/v1/scrape` to `/v2/scrape`
2. **Use stealth proxy** for Home Depot/Lowe's - Change `proxy: 'enhanced'` to `proxy: 'stealth'`
3. **Add blockAds option** - Enable ad blocking to reduce page complexity
4. **Simplify actions** - Use a simpler scroll action that reliably triggers content loading
5. **Add retry mechanism** - If stealth fails, return a clear error message

---

### Technical Implementation

**File: `supabase/functions/scrape-product-url/index.ts`**

**1. Update the Firecrawl API endpoint (line 721)**

Change from v1 to v2:
```typescript
// Before
const response = await fetch('https://api.firecrawl.dev/v1/scrape', {

// After
const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
```

**2. Update scrape options (lines 696-719)**

Use `stealth` proxy and add missing options:
```typescript
// Build scrape options
const scrapeOptions: Record<string, unknown> = {
  url: formattedUrl,
  formats: ['markdown', 'html'],
  onlyMainContent: false,
  waitFor: needsEnhancedMode ? 5000 : 3000,
  timeout: needsEnhancedMode ? 120000 : 30000, // 2 minutes for stealth
  location: {
    country: 'US',
    languages: ['en-US'],
  },
  blockAds: true, // Block ads and popups
};

// Use stealth proxy and actions for sites with aggressive anti-bot protection
if (needsEnhancedMode) {
  console.log('Using stealth mode for:', store);
  scrapeOptions.proxy = 'stealth'; // Changed from 'enhanced'
  // Simpler scroll action
  scrapeOptions.actions = [
    { type: 'wait', milliseconds: 3000 },
    { type: 'scroll', direction: 'down' },
    { type: 'wait', milliseconds: 2000 },
  ];
}
```

---

### Changes Summary

| Location | Change |
|----------|--------|
| Line 721 | Change API endpoint from v1 to v2 |
| Line 702 | Increase timeout to 120000ms (2 minutes) |
| Line 703-706 | Add `blockAds: true` option |
| Line 712 | Change `proxy: 'enhanced'` to `proxy: 'stealth'` |
| Lines 714-718 | Simplify actions with longer initial wait |

---

### Why Stealth Mode Helps

1. **Stealth Proxies**: Uses specialized residential proxies that appear as real users
2. **Anti-Detection**: Bypasses JavaScript-based bot detection used by Home Depot
3. **Cookie Handling**: Better cookie and session management
4. **Longer Timeouts**: 2-minute timeout allows for complex page loading

---

### Expected Result

- Home Depot product URLs should scrape successfully with stealth mode
- Product name, price, image, and specs will be extracted correctly
- Lowe's and other difficult sites will also benefit from this change
- Credit usage: Stealth mode costs more credits but ensures reliable scraping

