
## Redesign: Two-Step Add Item Flow (URL → Screenshot)

### What's Changing

The current flow is: URL → (scrape) → Category → Details

The new flow will be: URL (paste & save for reference) → Screenshot (optional, AI extracts data) → Category → Details

Scraping is completely removed from the new item flow. The URL is saved as a reference link only. The screenshot step is the new primary data extraction method.

### Step 1: URL Step (Mostly Unchanged)

- Same UI as today (matches the reference image the user provided)
- User pastes a URL into the input field
- Clicking **"Next"** saves the URL to `formData.source_url` and navigates to the new screenshot step — no scraping call is made
- "Skip & Enter Manually" still exists to skip both steps and go straight to category

### Step 2: Screenshot Step (New)

A new `'screenshot'` step is added to the `Step` type between `'url'` and `'category'`.

The UI will show:
- A camera/upload icon at the top
- Title: **"Upload a Screenshot"**
- Subtitle: *"Take a screenshot of the product page and upload it — we'll pull the name, price, and image automatically."*
- A large dashed upload zone (click to browse or Ctrl+V to paste)
- A "Parsing..." loading state with spinner when AI is processing
- A green success badge when data is extracted
- A **"Skip"** button at the bottom to go straight to category without uploading
- A **back arrow** to return to the URL step

When a screenshot is uploaded/pasted:
1. AI parses it via the existing `parse-product-screenshot` edge function
2. Form data is populated (name, price, model, image)
3. After success → automatically advances to the category step

### New State & Types

```typescript
// Add 'screenshot' between 'url' and 'category'
type Step = 'url' | 'screenshot' | 'category' | 'details';
```

No new state variables are needed — `parsingScreenshot`, `screenshotInputRef`, and `handleScreenshotUpload` already exist and do exactly what's needed here.

### Changes to Existing Logic

- **`handleScrapeUrl` → replaced by `handleNextFromUrl`**: Simply saves the URL to `formData` and sets `setStep('screenshot')`. No API call.
- **`showFallbackOptions` state**: No longer needed — the fallback options (screenshot card, enter manually) become a dedicated step instead of a conditional UI block. The state is kept for now but the fallback UI block inside `renderUrlStep` is removed.
- **URL step button**: Changes from "Extract Product Data" to **"Next →"** always (regardless of whether URL is filled in).
- **Paste listener**: The existing `useEffect` paste handler already checks `step === 'url' && showFallbackOptions` — this condition changes to `step === 'screenshot'` to trigger screenshot parsing on the new step.

### What Stays the Same

- The `renderCategoryStep` and `renderDetailsStep` are completely unchanged
- The `handleScreenshotUpload` function is completely unchanged
- Edit mode still skips directly to `'details'` step — no change
- The existing fallback options code is removed (no longer needed)
- The screenshot `<input>` ref and its file handler are moved into `renderScreenshotStep`

### Files to Change

- `src/components/procurement/ProcurementItemModal.tsx` only:
  1. Update `Step` type to include `'screenshot'`
  2. Replace `handleScrapeUrl` with a simple `handleNextFromUrl` function (no API call)
  3. Update the URL step render to remove fallback options block and change button label/handler
  4. Add `renderScreenshotStep()` function with the new upload UI
  5. Update the paste listener `useEffect` condition (`step === 'screenshot'` instead of `step === 'url' && showFallbackOptions`)
  6. Add `renderScreenshotStep()` to the step switcher in the JSX
  7. Update dialog title to show "Add Item — Step 2 of 3" style indicator (optional breadcrumb)
