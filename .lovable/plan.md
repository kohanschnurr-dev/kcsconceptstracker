

## Speed Up and Stabilize Receipt Scanning

### Problem
Mobile receipt scanning is slow and unreliable because full-resolution phone photos (5-10MB base64) are sent to the slowest AI model with no compression, retries, or timeout handling.

### Changes

---

### 1. Client-Side Image Compression (QuickExpenseModal.tsx)

Add a `compressImage` utility that uses HTML Canvas to resize photos before sending:

- Max dimension: 1600px (plenty for receipt OCR)
- JPEG quality: 0.8
- Typical result: ~200-400KB instead of 5-10MB

This runs in the `handleFileChange` handler. The compressed base64 replaces the raw `receiptPreview` sent to the edge function.

```text
Before: 8MB raw phone photo -> base64 -> edge function -> AI
After:  300KB compressed     -> base64 -> edge function -> AI
```

---

### 2. Switch AI Model to gemini-2.5-flash (parse-receipt-image/index.ts)

Change `model: "google/gemini-2.5-pro"` to `model: "google/gemini-2.5-flash"`.

Gemini Flash is purpose-built for fast multimodal tasks. It reads receipts just as accurately but responds 3-5x faster. The detailed system prompt already guides extraction well enough that Pro-level reasoning isn't needed.

---

### 3. Add Retry Logic (parse-receipt-image/index.ts)

Wrap the AI fetch call in a retry loop (up to 2 retries with 1s delay). This handles transient network errors and 429 rate limits gracefully instead of failing immediately.

---

### 4. Add Client-Side Timeout (QuickExpenseModal.tsx)

Add an `AbortController` with a 25-second timeout around the `supabase.functions.invoke` call. If the scan times out, show a clear message: "Scan timed out -- try a clearer photo or paste the receipt text instead." This prevents the user from waiting indefinitely.

---

### 5. Better Error Messages (QuickExpenseModal.tsx)

Replace generic "Scan failed" with specific messages:
- Timeout: "Scan timed out. Try a clearer photo or use the paste option."
- Rate limit (429): "Too many scans. Please wait a moment."
- Large file: Warning before upload if file > 5MB raw

---

### Summary

| File | Change |
|------|--------|
| `src/components/QuickExpenseModal.tsx` | Add image compression, timeout, better errors |
| `supabase/functions/parse-receipt-image/index.ts` | Switch to flash model, add retry logic |

### Expected Impact
- **Speed**: 3-8x faster (smaller payload + faster model)
- **Reliability**: Retries handle transient failures; timeout prevents infinite waits
- **Data usage**: ~95% less data transferred on mobile

