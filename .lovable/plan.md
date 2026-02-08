

## Plan: Add Mobile-Only "Scan Receipt" Quick Action

### Overview
Add a prominent "Scan Receipt" button that appears **only on mobile** at the top of the SmartSplit section. This allows you to quickly upload receipt photos without needing to expand the collapsible panel first.

---

### Current vs. Proposed Mobile Flow

| Current | Proposed |
|---------|----------|
| Tap to expand SmartSplit | **Scan button visible immediately** |
| Find upload zone inside | Tap "Scan" to open camera |
| Upload photo | Same upload flow |

---

### Changes

**File: `src/components/SmartSplitReceiptUpload.tsx`**

#### 1. Add Camera icon and useIsMobile hook imports

```tsx
import { Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
```

#### 2. Add mobile hook and hidden file input ref

Inside the component, add:
```tsx
const isMobile = useIsMobile();
const mobileScanInputRef = useRef<HTMLInputElement>(null);
```

#### 3. Add mobile scan handler

```tsx
// Mobile scan - opens camera directly
const handleMobileScan = () => {
  mobileScanInputRef.current?.click();
};
```

#### 4. Add Mobile Scan Button above the Collapsible

Right after the `return (` and before `<>`, add a mobile-only scan section:

```tsx
return (
  <>
    {/* Mobile Quick Scan Button - visible only on mobile, outside collapsible */}
    {isMobile && (
      <>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              processMultipleFiles(files);
              // Auto-expand to show progress
              setIsExpanded(true);
            }
          }}
          className="hidden"
          ref={mobileScanInputRef}
        />
        <Button
          className="w-full gap-2 h-12 text-base"
          onClick={handleMobileScan}
          disabled={isUploading || isParsing}
        >
          {isUploading || isParsing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {uploadProgress ? `Processing ${uploadProgress.current}/${uploadProgress.total}...` : 'Processing...'}
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              Scan Receipt
            </>
          )}
        </Button>
      </>
    )}

    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      {/* ... existing code ... */}
    </Collapsible>
  </>
);
```

---

### Visual Result (Mobile Only)

```text
┌─────────────────────────────────────┐
│  📷  Scan Receipt                   │  ← NEW: Always visible on mobile
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ ✨ SmartSplit Receipt Matching      │
│    3 waiting  2 matched!        ▼   │
└─────────────────────────────────────┘
```

---

### Behavior Summary

| Feature | Description |
|---------|-------------|
| Mobile only | Button hidden on desktop (uses existing upload zone) |
| Opens camera | Uses `capture="environment"` to open rear camera |
| Multi-file support | Supports selecting multiple photos |
| Auto-expands | Opens the collapsible to show parsing progress |
| Shows progress | Displays "Processing 1/3..." during batch uploads |
| Disabled during upload | Prevents double-taps while processing |

---

### Technical Details

**Files to modify:**
- `src/components/SmartSplitReceiptUpload.tsx`

**New imports:**
- `Camera` from lucide-react
- `useIsMobile` from hooks

**Key attributes:**
- `capture="environment"` - Opens device camera (rear camera preferred)
- `accept="image/*"` - Only images
- `multiple` - Allow batch selection

