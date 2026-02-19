
## Fix: Amazon Scraping Returning "General Item" with No Price/Image

### Root Cause (Confirmed from Live Logs)

The edge function logs show exactly what's happening:

```
Firecrawl response: status=408 success=false mdLen=0 htmlLen=0 aiJson=null
FINAL — price: null | image: NO | name: General Item
```

**Firecrawl is timing out on every Amazon request (HTTP 408).** Amazon's anti-bot infrastructure is significantly more aggressive than Home Depot or Lowe's and requires more time to render. The current code gives Amazon only a **12-second timeout with no `waitFor` delay and no custom User-Agent** — which is exactly what makes HD/Lowe's fail when not given special treatment.

Looking at line 879-892:
```typescript
const needsWaitFor = store === 'home_depot' || store === 'lowes'; // Amazon excluded!
const attemptTimeout = needsWaitFor ? 20000 : 12000;             // Amazon gets 12s
const attemptWaitFor = store === 'home_depot' ? 3000 : ...       // Amazon gets undefined
// withUserAgent: needsWaitFor                                    // Amazon gets no UA header
```

Amazon needs the same (or stronger) treatment as HD/Lowe's.

### The Fix

**File: `supabase/functions/scrape-product-url/index.ts`** — update the scraping configuration block (lines 879–892) to include Amazon in the "needs special treatment" group:

```typescript
// BEFORE
const needsWaitFor = store === 'home_depot' || store === 'lowes';
const attemptTimeout = needsWaitFor ? 20000 : 12000;
const attemptWaitFor = store === 'home_depot' ? 3000 : store === 'lowes' ? 2000 : undefined;

// AFTER
const needsWaitFor = store === 'home_depot' || store === 'lowes' || store === 'amazon';
const attemptTimeout = store === 'amazon' ? 25000 : needsWaitFor ? 20000 : 12000;
const attemptWaitFor = store === 'amazon' ? 3000 : store === 'home_depot' ? 3000 : store === 'lowes' ? 2000 : undefined;
```

This gives Amazon:
- **25 second timeout** (Firecrawl needs time to bypass bot-detection)
- **3 second `waitFor`** (lets the JS-rendered price load)
- **Custom User-Agent header** (looks like a real Chrome browser)

### Why Amazon Is Harder Than HD/Lowe's

Amazon uses CloudFront + sophisticated bot fingerprinting. Firecrawl's stealth mode requires extra time to spoof headers, handle redirects, and wait for deferred JS to hydrate the price/image elements. 12 seconds simply isn't enough — 25 seconds gives Firecrawl's headless browser enough runway.

### Files to Change

- `supabase/functions/scrape-product-url/index.ts` — 3 lines changed in the scraping config block (lines 879–892)

### What Stays the Same

- All extraction logic (AI JSON, HTML regex, markdown regex) is unchanged
- HD and Lowe's behavior is unchanged
- The screenshot/paste fallback still works as the backup when scraping fails
- No frontend changes needed
