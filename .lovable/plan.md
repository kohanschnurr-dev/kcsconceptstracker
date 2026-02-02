

## Plan: Transform Scrape Fallback into Friendly Options

### Overview

When the product URL scraper fails (e.g., Home Depot times out), instead of showing a red error banner, we'll present a friendly blue/gray info state with two clear options:

1. **Enter Manually** - Proceed to manual entry with the URL saved
2. **Upload Screenshot** - Upload a product page screenshot and let AI extract the details

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/procurement/ProcurementItemModal.tsx` | Replace error UI with friendly options UI, add screenshot upload handler |
| `supabase/functions/parse-product-screenshot/index.ts` | NEW - Edge function to parse product screenshots using Lovable AI Vision |

---

### UI Change: From Error to Friendly Fallback

**Current (Error State):**
```text
┌─────────────────────────────────────────┐
│ ⚠ Could not extract product data (red) │
│ [Continue with manual entry →]          │
└─────────────────────────────────────────┘
```

**New (Friendly Options State):**
```text
┌──────────────────────────────────────────────────────┐
│ 🔗 Couldn't auto-extract from this page              │
│    No worries - here are your options:               │
│                                                      │
│ ┌──────────────────┐  ┌──────────────────┐          │
│ │   📝 Enter       │  │   📸 Upload      │          │
│ │   Manually       │  │   Screenshot     │          │
│ │                  │  │                  │          │
│ │ Type in the      │  │ We'll read it    │          │
│ │ details yourself │  │ for you          │          │
│ └──────────────────┘  └──────────────────┘          │
└──────────────────────────────────────────────────────┘
```

---

### Technical Details

**File: `src/components/procurement/ProcurementItemModal.tsx`**

1. **New State Variables:**
```typescript
const [showFallbackOptions, setShowFallbackOptions] = useState(false);
const [parsingScreenshot, setParsingScreenshot] = useState(false);
const screenshotInputRef = useRef<HTMLInputElement>(null);
```

2. **Update Error Handler:**
- Instead of setting `setScrapeError(message)`, set `setShowFallbackOptions(true)` and save the URL
- Remove the red destructive styling
- Don't show toast.error (remove "error" feel)

3. **Add Screenshot Upload Handler:**
```typescript
const handleScreenshotUpload = async (file: File) => {
  setParsingScreenshot(true);
  try {
    // Convert to base64
    const base64 = await fileToBase64(file);
    
    // Call AI parsing function
    const { data, error } = await supabase.functions.invoke('parse-product-screenshot', {
      body: { image_base64: base64 }
    });
    
    if (error) throw error;
    
    // Populate form with parsed data
    setFormData(prev => ({
      ...prev,
      name: data.name || prev.name,
      unit_price: data.price?.toString() || prev.unit_price,
      model_number: data.model_number || prev.model_number,
      finish: data.finish || prev.finish,
      source_url: urlInput.trim(),
      source_store: detectStoreFromUrl(urlInput),
    }));
    
    setShowFallbackOptions(false);
    setStep('category');
    toast.success('Product info extracted from screenshot!');
  } catch (err) {
    toast.error('Could not read screenshot - try entering manually');
  } finally {
    setParsingScreenshot(false);
  }
};
```

4. **New Fallback Options UI:**
```tsx
{showFallbackOptions && (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted p-3 rounded-lg">
      <LinkIcon className="h-4 w-4 flex-shrink-0" />
      <span>Couldn't auto-extract from this page. No worries!</span>
    </div>
    
    <div className="grid grid-cols-2 gap-3">
      {/* Enter Manually Card */}
      <button
        onClick={() => {
          setFormData(prev => ({
            ...prev,
            source_url: urlInput.trim(),
            source_store: detectStoreFromUrl(urlInput),
          }));
          setShowFallbackOptions(false);
          setStep('category');
        }}
        className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
      >
        <Pencil className="h-6 w-6 text-muted-foreground" />
        <span className="font-medium">Enter Manually</span>
        <span className="text-xs text-muted-foreground text-center">Type in the details yourself</span>
      </button>
      
      {/* Upload Screenshot Card */}
      <button
        onClick={() => screenshotInputRef.current?.click()}
        disabled={parsingScreenshot}
        className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
      >
        {parsingScreenshot ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <Camera className="h-6 w-6 text-muted-foreground" />
        )}
        <span className="font-medium">Upload Screenshot</span>
        <span className="text-xs text-muted-foreground text-center">We'll read it for you</span>
      </button>
    </div>
    
    <input
      type="file"
      ref={screenshotInputRef}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleScreenshotUpload(file);
        e.target.value = '';
      }}
      accept="image/*"
      className="hidden"
    />
  </div>
)}
```

---

**File: `supabase/functions/parse-product-screenshot/index.ts`** (NEW)

Create a new edge function that uses Lovable AI Vision to parse product screenshots:

```typescript
// Uses google/gemini-2.5-flash for speed
// Extracts: name, price, model_number, finish, brand, dimensions
// Returns structured JSON for form population
```

**AI Prompt Focus:**
- Extract product name (concise, 3-5 words)
- Extract price (current/sale price preferred)
- Extract model/SKU number
- Extract finish/color
- Extract brand
- Handle Home Depot, Lowe's, Amazon, etc. layouts

---

### Flow Diagram

```text
User pastes URL
      │
      ▼
[Try Auto-Scrape]
      │
      ├── Success ──► Populate form ──► Category step
      │
      └── Fail ──► Show Friendly Options
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
     [Enter Manually]          [Upload Screenshot]
            │                           │
            ▼                           ▼
    Save URL, go to           Parse with AI Vision
    category step                       │
                                        ▼
                              Populate form ──► Category step
```

---

### Key Behavior Changes

| Current | New |
|---------|-----|
| Red error banner with "Error" styling | Gray/neutral info box with friendly message |
| `toast.error()` on scrape fail | No toast (just show options) |
| Single "Continue with manual entry" button | Two card options: Manual + Screenshot |
| Feels like something broke | Feels like a simple alternative path |

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/procurement/ProcurementItemModal.tsx` | Modify - Replace error UI, add screenshot handler |
| `supabase/functions/parse-product-screenshot/index.ts` | Create - New AI vision parsing function |

