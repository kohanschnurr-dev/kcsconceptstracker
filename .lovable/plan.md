

## Plan: Enable Multi-File Receipt Upload

### Overview
Add the ability to select and upload multiple receipt files at once in the Smart Receipt Upload component. Each file will be processed sequentially (to avoid overwhelming the AI parsing), and users will see progress as files are parsed.

---

### Current Behavior
- File input accepts only one file at a time
- Drag-and-drop only processes the first dropped file
- Clipboard paste only processes the first image

### New Behavior
- File picker allows selecting multiple files
- Drag-and-drop processes all dropped files
- Each file is uploaded and parsed sequentially
- Progress indicator shows "Parsing 2 of 5..." status
- All receipts appear in the pending list after processing

---

### UI Changes

**Upload area during multi-file processing:**
```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│           🔄 Parsing receipt 2 of 5...              │
│                                                     │
│              Home_Depot_receipt.jpg                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Technical Changes

| Location | Change |
|----------|--------|
| File input element | Add `multiple` attribute |
| `handleFileInput` function | Loop through all selected files |
| `handleDrop` function | Loop through all dropped files |
| State management | Track upload progress (current/total) |
| UI feedback | Show which file is being processed |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/SmartSplitReceiptUpload.tsx` | Add multi-file support to input, drag-drop, and upload functions |

---

### Implementation Details

**1. Add state for tracking multi-file progress:**

```typescript
const [uploadProgress, setUploadProgress] = useState<{
  current: number;
  total: number;
  currentFileName: string;
} | null>(null);
```

**2. Update file input to accept multiple:**

```tsx
<input
  type="file"
  accept="image/*,.pdf"
  multiple  // ← Add this
  onChange={handleFileInput}
  className="hidden"
  id="receipt-upload"
  disabled={isUploading}
/>
```

**3. Update `handleFileInput` to process all files:**

```typescript
const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const files = Array.from(e.target.files);
    await processMultipleFiles(files);
  }
};
```

**4. Update `handleDrop` to process all dropped files:**

```typescript
const handleDrop = useCallback(async (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
  
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    await processMultipleFiles(files);
  }
}, []);
```

**5. Create new `processMultipleFiles` function:**

```typescript
const processMultipleFiles = async (files: File[]) => {
  if (files.length === 0) return;
  
  setIsUploading(true);
  setUploadProgress({ current: 0, total: files.length, currentFileName: '' });
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    setUploadProgress({ 
      current: i + 1, 
      total: files.length, 
      currentFileName: file.name 
    });
    
    try {
      await handleFileUpload(file);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      // Continue with remaining files
    }
  }
  
  setUploadProgress(null);
  setIsUploading(false);
};
```

**6. Update upload area UI to show multi-file progress:**

```tsx
{uploadProgress && uploadProgress.total > 1 ? (
  <div className="flex flex-col items-center gap-2">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm font-medium">
      Parsing receipt {uploadProgress.current} of {uploadProgress.total}...
    </p>
    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
      {uploadProgress.currentFileName}
    </p>
  </div>
) : isParsing ? (
  // Single file parsing (existing behavior)
  ...
)}
```

---

### Edge Cases Handled

| Case | Behavior |
|------|----------|
| Mixed valid/invalid files | Invalid files (non-images, non-PDFs) are filtered out |
| One file fails to parse | Error toast shown, continue with remaining files |
| User selects 0 files | No action taken |
| Large batch (10+ files) | All processed sequentially with progress |

---

### Result

| Before | After |
|--------|-------|
| Select one file at a time | Select multiple files at once |
| Re-open picker for each receipt | Upload entire batch from folder |
| No progress for single file | Progress indicator for batches |

