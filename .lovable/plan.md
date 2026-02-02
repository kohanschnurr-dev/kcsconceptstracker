

## Plan: Add Ctrl+V Quick Paste for Screenshot Upload

### Overview

Add keyboard paste functionality (Ctrl+V / Cmd+V) to the fallback options screen so users can quickly paste a product screenshot without having to click "Upload Screenshot" first.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/procurement/ProcurementItemModal.tsx` | Add paste event listener for URL step when fallback options are shown |

---

### Technical Details

**File: `src/components/procurement/ProcurementItemModal.tsx`**

**1. Update the paste event listener (lines 489-508)**

Currently, paste only works on the `details` step for product images. We need to extend it to also handle the `url` step when `showFallbackOptions` is true.

```typescript
// Current logic (only details step)
useEffect(() => {
  if (!open || step !== 'details') return;
  // ... paste handler for product image upload
}, [open, step]);

// New logic - also handle URL step with fallback options
useEffect(() => {
  if (!open) return;
  
  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // If on URL step with fallback showing - parse as product screenshot
          if (step === 'url' && showFallbackOptions) {
            await handleScreenshotUpload(file);
          } 
          // If on details step - upload as product image
          else if (step === 'details') {
            await uploadImage(file);
          }
        }
        break;
      }
    }
  };
  
  document.addEventListener('paste', handlePaste);
  return () => document.removeEventListener('paste', handlePaste);
}, [open, step, showFallbackOptions]);
```

---

**2. Add visual hint to the Upload Screenshot card (around line 895)**

Add a hint so users know they can just paste:

```tsx
{/* Upload Screenshot Card */}
<button
  onClick={() => screenshotInputRef.current?.click()}
  disabled={parsingScreenshot}
  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
>
  {parsingScreenshot ? (
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  ) : (
    <Camera className="h-6 w-6 text-muted-foreground" />
  )}
  <span className="font-medium">Upload Screenshot</span>
  <span className="text-xs text-muted-foreground text-center">
    Ctrl+V to paste or click to browse
  </span>
</button>
```

---

### User Experience

| Trigger | Action |
|---------|--------|
| URL scrape fails | Show fallback options |
| User presses Ctrl+V with image in clipboard | Immediately sends image to AI for parsing |
| User clicks "Upload Screenshot" | Opens file picker |
| AI successfully parses | Moves to category step with extracted data |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/procurement/ProcurementItemModal.tsx` | Extend paste handler to work on URL step with fallback options, update hint text |

