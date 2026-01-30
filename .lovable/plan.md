

## Fix: Receipt Parsing Stalling After Model Upgrade

### Problem
After upgrading from `gemini-2.5-flash` to `gemini-2.5-pro`, receipt parsing is stalling/timing out. The Pro model is more accurate but significantly slower.

---

### Root Cause

| Model | Speed | Accuracy | Receipt Parse Time |
|-------|-------|----------|-------------------|
| gemini-2.5-flash | Fast | Good | ~5-10 seconds |
| gemini-2.5-pro | Slow | Best | ~20-45 seconds |

Edge Functions have a timeout limit, and the Pro model with complex image+text analysis is hitting or approaching that limit.

---

### Solution

Switch back to `gemini-2.5-flash` but **keep the improved Amazon-specific prompt**. The flash model with better prompt engineering should give us:
- Fast parsing (~5-10 seconds)
- Improved accuracy from the detailed Amazon instructions

---

### Implementation

**File:** `supabase/functions/parse-receipt-image/index.ts`

**Single change at line 86:**
```typescript
// Change from:
model: "google/gemini-2.5-pro",

// To:
model: "google/gemini-2.5-flash",
```

---

### Why This Works

The improved prompt with Amazon-specific rules will guide the Flash model to:
1. Look for "Qty:" patterns correctly
2. Treat prices as line totals (not unit prices)
3. Calculate unit prices by dividing
4. Validate math before returning

The prompt improvements are model-agnostic - they benefit any model we use.

---

### Expected Results

- Parsing completes in 5-10 seconds (no stalling)
- Keeps the Amazon-specific quantity parsing improvements
- Better user experience with faster feedback

