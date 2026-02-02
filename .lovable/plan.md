

## Plan: Faster Fail-Fast Timeout for URL Scraping

### Overview

Reduce the wait time when scraping fails by implementing an aggressive abort controller timeout on the frontend and reducing the Firecrawl timeout further. Currently users wait 15+ seconds for Home Depot/Lowes URLs that consistently timeout - we should give up much faster (5-8 seconds).

---

### Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/scrape-product-url/index.ts` | Reduce Firecrawl timeout from 15s to 8s |
| `src/components/procurement/ProcurementItemModal.tsx` | Add AbortController with 10s client-side timeout |

---

### Technical Details

**File: `supabase/functions/scrape-product-url/index.ts`**

Reduce the Firecrawl timeout from 15 seconds to 8 seconds. This is still enough time for most successful scrapes but fails faster on problematic sites:

```typescript
// Line 788 - Change timeout from 15000 to 8000
const basicScrapeOptions = {
  url: formattedUrl,
  formats: ['markdown', 'html'],
  onlyMainContent: false,
  timeout: 8000, // 8 seconds - fail fast!
  location: { country: 'US', languages: ['en-US'] },
};
```

---

**File: `src/components/procurement/ProcurementItemModal.tsx`**

Add a client-side AbortController to ensure the frontend doesn't wait indefinitely:

```typescript
const handleScrapeUrl = async () => {
  if (!urlInput.trim()) return;
  
  setScrapingUrl(true);
  
  // Create abort controller with 10s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const { data, error } = await supabase.functions.invoke('scrape-product-url', {
      body: { url: urlInput.trim() },
    });
    
    clearTimeout(timeoutId);
    
    // ... rest of handler
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      toast({
        title: "Scraping timed out",
        description: "This site is slow to respond. Try pasting a screenshot instead.",
        variant: "destructive",
      });
    }
    // ... error handling
  }
};
```

---

### Timeout Strategy

```text
Current behavior:
User clicks "Scrape" → Waits 15-30 seconds → Times out

New behavior:
User clicks "Scrape" → Waits 8-10 seconds max → Shows helpful message

Timeline:
0s ────────── 8s ─────────── 10s
   Firecrawl    Edge fn      Client
   timeout      returns      aborts
```

---

### User Experience

| Before | After |
|--------|-------|
| Wait 15-30+ seconds for timeout | Wait max 10 seconds |
| Unclear what's happening | Clear timeout message |
| Same error for all failures | Suggests screenshot alternative |

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/scrape-product-url/index.ts` | Line 788: Change `timeout: 15000` to `timeout: 8000` |
| `src/components/procurement/ProcurementItemModal.tsx` | Add AbortController with 10s timeout to `handleScrapeUrl` |

