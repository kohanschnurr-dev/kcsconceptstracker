

## Plan: Fix Edge Function Error Handling with FunctionsHttpError

### Problem

When the `scrape-product-url` edge function returns a 408 error with a JSON body like:
```json
{"success":false,"error":"Could not scrape this URL. Home Depot pages may require manual price entry."}
```

The current error handling doesn't properly extract that message. Instead, it shows a generic error because we're not using Supabase's `FunctionsHttpError` class to parse the response.

### Solution

Use `FunctionsHttpError` from `@supabase/supabase-js` to properly extract the error message from the function response body.

---

### Technical Changes

**File: `src/components/procurement/ProcurementItemModal.tsx`**

**1. Add import for FunctionsHttpError (at the top with other imports)**

```typescript
import { FunctionsHttpError } from '@supabase/supabase-js';
```

**2. Update error handling in handleScrape (lines 581-585)**

Replace:
```typescript
} catch (err) {
  console.error('Scrape error:', err);
  const message = err instanceof Error ? err.message : 'Failed to scrape URL';
  setScrapeError(message);
  toast.error(message);
}
```

With:
```typescript
} catch (err) {
  console.error('Scrape error:', err);
  
  let message = 'Failed to scrape URL';
  
  // Handle FunctionsHttpError to extract the actual error message from response body
  if (err instanceof FunctionsHttpError) {
    try {
      const errorData = await err.context.json();
      message = errorData.error || message;
    } catch {
      // If we can't parse JSON, use the default message
    }
  } else if (err instanceof Error) {
    message = err.message;
  }
  
  setScrapeError(message);
  toast.error(message);
}
```

---

### What This Fixes

| Before | After |
|--------|-------|
| Generic "FunctionsHttpError" or cryptic message | Actual message: "Could not scrape this URL. Home Depot pages may require manual price entry." |
| User confused about what went wrong | Clear guidance to use manual entry |

---

### Why This Works

1. **FunctionsHttpError**: Supabase wraps HTTP errors from edge functions in this class
2. **error.context.json()**: Contains the actual response body we returned from the function
3. **Fallback handling**: If JSON parsing fails, we still show a reasonable error

