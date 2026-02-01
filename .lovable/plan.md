
## Plan: Quick Fix for Home Depot Price Extraction

### The Real Problem

The scrape is **timing out completely** (even with 2-minute timeout) - so no content is returned at all. The extraction functions never even run.

Looking at the logs:
- `SCRAPE_TIMEOUT` error - page took too long
- `ERR_TUNNEL_CONNECTION_FAILED` - proxy issues

The stealth mode is actually making things WORSE by adding complexity.

### Quick Solution

**Try a fast, simple scrape FIRST** - without stealth proxy and without scroll actions. Many sites include price data in the initial HTML even before JavaScript renders:

1. **First attempt**: Fast basic scrape (10 second timeout, no proxy, no actions)
2. **Fallback**: If that fails, try the enhanced mode

This way we get SOMETHING back quickly instead of timing out completely.

### Technical Changes

**File: `supabase/functions/scrape-product-url/index.ts`**

**1. Add a two-attempt strategy (around lines 759-807)**

```typescript
// Try fast scrape first, then fallback to enhanced mode
let data: any = null;
let usedEnhancedMode = false;

// ATTEMPT 1: Fast basic scrape (no proxy, no actions, short timeout)
const basicScrapeOptions = {
  url: formattedUrl,
  formats: ['markdown', 'html'],
  onlyMainContent: false,
  timeout: 15000, // 15 seconds
  location: { country: 'US', languages: ['en-US'] },
};

console.log('Attempting fast basic scrape for:', store);
let response = await fetch('https://api.firecrawl.dev/v1/scrape', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(basicScrapeOptions),
});

data = await response.json();

// If basic scrape failed and this is a difficult site, try enhanced mode
if (!response.ok && needsEnhancedMode) {
  console.log('Basic scrape failed, trying enhanced mode...');
  usedEnhancedMode = true;
  
  const enhancedOptions = {
    ...basicScrapeOptions,
    timeout: 90000,
    proxy: 'stealth',
    actions: [
      { type: 'wait', milliseconds: 3000 },
      { type: 'scroll', direction: 'down' },
      { type: 'wait', milliseconds: 2000 },
    ],
  };
  
  response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(enhancedOptions),
  });
  
  data = await response.json();
}

// Handle final error
if (!response.ok) {
  console.error('Firecrawl API error:', data);
  return new Response(
    JSON.stringify({ success: false, error: data.error || 'Scrape failed' }),
    { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**2. Also add super-simple price fallback for markdown (in extractPriceFromMarkdown)**

If we get any markdown back, grab the first reasonable price we see:

```typescript
// Ultra-simple fallback: just find ANY price in the markdown for HD/Lowes
if ((store === 'home_depot' || store === 'lowes') && candidates.length === 0) {
  const allPrices = [...markdown.matchAll(/\$(\d{2,4}\.\d{2})/g)];
  for (const match of allPrices) {
    const price = parseFloat(match[1]);
    if (price >= 15 && price < 10000) {
      console.log('Using simple fallback price:', price);
      return price;
    }
  }
}
```

### Changes Summary

| Location | Change |
|----------|--------|
| Lines 759-807 | Replace single-attempt with two-attempt strategy |
| Line 374-382 | Add simpler price fallback for HD/Lowes |

### Why This Works

1. **Fast first attempt**: Most pages have price in initial HTML/JSON data
2. **No timeout on basic pages**: 15-second timeout is enough for basic content
3. **Fallback still available**: If basic fails, we try enhanced
4. **Credit-efficient**: Basic scrape costs 1 credit, enhanced costs 5+

### Expected Result

- Home Depot URLs get a quick response (15 seconds or less)
- Price extracted from embedded JSON or simple markdown patterns
- If that fails, falls back to enhanced mode
- Much higher success rate overall
