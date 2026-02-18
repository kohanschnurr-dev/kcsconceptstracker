
## Buff the Product Scraper — Comprehensive Upgrade

### Problems to Fix

**1. Amazon price never extracted**
The scraper uses `needsEnhancedMode = false` for Amazon. Amazon serves bot-blocked, JS-stripped HTML so all the regex price patterns (`apexPriceToPay`, `corePrice_feature_div`, etc.) match nothing. Result: `price: null` every time.

**2. Amazon image rarely extracted**
The HTML Amazon returns encodes `data-a-dynamic-image` as `&quot;` entities. The current regex `data-a-dynamic-image="\{&quot;([^&]+)&quot;` correctly targets this but the URL it captures often includes only part of the URL before another `&quot;`. Additionally the `og:image` fallback works, but that requires full HTML which isn't served on blocked pages.

**3. Enhanced mode never actually fires**
`needsEnhancedMode` is set for HD and Lowes but the code never sends different options — `usedEnhancedMode` stays `false` and only one attempt is ever made. HD and Lowes pages are JavaScript-heavy SPAs; without `waitFor` or headless rendering they return shells.

**4. No AI extraction fallback**
When HTML scraping fails, there's no LLM fallback to parse the scraped markdown. This is the biggest gap — Firecrawl supports a `json` format with a prompt that uses AI to extract structured data from the scraped content, which is perfect for product pages.

**5. Model number regex is broken**
```js
const match = markdown.match(pattern); // Returns RegExp match array
model_number = match[1] || match[0].split(...) // match[1] is undefined for non-capture patterns
```
The patterns use `/gi` flags with `.match()` which returns all matches but loses capture groups. Should use `.exec()`.

**6. Amazon image: `og:image` is the most reliable fallback — it's not being tried early enough**
`og:image` is in `<meta>` tags which ARE present even on bot-blocked Amazon pages. Moving it earlier in the Amazon extraction chain would fix the most common image failure.

---

### Solution: 4-Layer Extraction Strategy

**Layer 1 — Firecrawl `json` format with AI prompt (NEW)**
Add `json` as an additional format to the Firecrawl request with a structured extraction prompt. This uses Firecrawl's built-in LLM to extract `name`, `price`, `brand`, `model_number` directly from page content — no regex needed. This works even on bot-deflected pages that have *some* content.

```json
{
  "formats": ["markdown", "html", "json"],
  "jsonOptions": {
    "prompt": "Extract product information: name (full product title), price (numeric, USD), brand, model_number, finish/color, material"
  }
}
```

**Layer 2 — Store-specific HTML regex (existing, fixed)**
Keep existing Amazon/HD/Lowes patterns but fix the model number regex and improve Amazon image extraction order (try `og:image` and `data-old-hires` first since those survive bot-blocking better than `landingImage`).

**Layer 3 — Markdown regex (existing, improved)**  
Improve the price regex — add patterns for prices that appear in the scraped markdown from Amazon pages (e.g., `**$29.99**`, `Price: $29.99`).

**Layer 4 — Enable enhanced mode for Amazon + HD + Lowes**
Change `needsEnhancedMode` to include Amazon. When the basic scrape returns no price AND no image, try a second enhanced Firecrawl request with `actions` (click, wait) for HD/Lowes, and use stealth mode for Amazon. Cap at 15 second timeout.

---

### Specific Code Changes

#### `supabase/functions/scrape-product-url/index.ts`

**Change 1 — Add `json` format with AI extraction prompt to Firecrawl request**

Currently:
```ts
formats: ['markdown', 'html'],
```

Change to:
```ts
formats: ['markdown', 'html', { type: 'json', prompt: 'Extract: name (full product title), price (number only, no $ sign), brand, model_number or SKU, finish or color, material. Return null for any field not found.' }],
```

**Change 2 — Use AI-extracted JSON as Layer 1 data source**

After Firecrawl responds, check `data.data?.json` (or `data.json`) first:
```ts
const aiExtracted = data.data?.json || data.json || null;

// Apply AI extraction first (most reliable)
if (aiExtracted?.price) price = parseFloat(String(aiExtracted.price));
if (aiExtracted?.name && !isGarbageName(aiExtracted.name)) name = aiExtracted.name;
if (aiExtracted?.brand) brand = aiExtracted.brand;
if (aiExtracted?.model_number) model_number = aiExtracted.model_number;
if (aiExtracted?.finish) finish = aiExtracted.finish;
```

**Change 3 — Fix Amazon image extraction order**
Move `og:image` check to run FIRST for Amazon (before the `landingImage` patterns that require full JS-rendered HTML). Also decode `&quot;` entities in the `data-a-dynamic-image` pattern properly:

```ts
// Fix: decode HTML entities FIRST
const decodedHtml = html.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

// Then run patterns on decoded HTML
const amazonPatterns = [
  /property="og:image"[^>]+content="([^"]+)"/i,   // og:image — most resilient
  /data-old-hires="([^"]+)"/i,                      // high-res data attribute
  /"hiRes":"([^"]+)"/i,                             // JSON embed
  /id="landingImage"[^>]+src="([^"]+)"/i,           // JS-rendered (needs enhanced mode)
  /data-a-dynamic-image="\{([^}]+)\}"/i,            // dynamic image JSON
];
```

**Change 4 — Fix model number regex using `.exec()` with capture groups**
```ts
// BEFORE (broken):
const modelPatterns = [/model\s*#?\s*:?\s*([A-Z0-9\-]+)/gi, ...];
for (const pattern of modelPatterns) {
  const match = markdown.match(pattern); // loses capture groups!
  model_number = match[1] || ...

// AFTER (fixed):
const modelPatterns = [/model\s*(?:number|#|no\.?)?\s*:?\s*([A-Z0-9][A-Z0-9\-]{2,20})/i, ...];
for (const pattern of modelPatterns) {
  const match = pattern.exec(markdown);
  if (match && match[1]) {
    model_number = match[1].trim();
    break;
  }
}
```

**Change 5 — Enable enhanced mode for Amazon too**
```ts
// BEFORE:
const needsEnhancedMode = store === 'home_depot' || store === 'lowes';

// AFTER:
const needsEnhancedMode = store === 'home_depot' || store === 'lowes' || store === 'amazon';
```

And actually implement the enhanced mode attempt when price + image are both null after Layer 1+2+3:
```ts
// If we got nothing useful, try enhanced mode
if (!price && !image_url && needsEnhancedMode) {
  // Second Firecrawl attempt with longer timeout + stealth headers
  const enhancedResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
    ...
    body: JSON.stringify({
      url: formattedUrl,
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      timeout: 20000,
      location: { country: 'US' },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      waitFor: store === 'home_depot' ? 3000 : 2000,
    }),
  });
}
```

**Change 6 — Improve Amazon price patterns in markdown**

The scraped markdown from Amazon often contains price strings like `**$29.99**` or `$29.99 with Prime`. Add these patterns:
```ts
// Amazon markdown price patterns
{ pattern: /\*{1,2}\$(\d{1,4}(?:\.\d{2})?)\*{1,2}/, score: 9 },  // bold price
{ pattern: /\$(\d{1,4}\.\d{2})\s*(?:with Prime|& FREE|Save)/i, score: 8 },
{ pattern: /(?:List Price|Was):\s*~~\$[\d.]+~~.*?\$(\d{1,4}\.\d{2})/is, score: 7 },
```

---

### Files to Modify

| File | Change |
|---|---|
| `supabase/functions/scrape-product-url/index.ts` | Add Firecrawl JSON AI extraction; fix Amazon image decode; fix model# regex; enable enhanced mode for Amazon; improve markdown price patterns |

### What This Fixes

| Issue | Fix |
|---|---|
| Amazon price = null | AI JSON extraction from Firecrawl + enhanced mode |
| Amazon image = null | Decode `&quot;` entities; try `og:image` first; enhanced mode fallback |
| HD/Lowes price unreliable | AI JSON extraction as Layer 1 |
| Model number always null | Fix `.exec()` with capture groups |
| Enhanced mode never fires | Actually implement the 2nd attempt |

This is a purely backend change — no frontend files need modification. The edge function is redeployed automatically.
