

## Plan: Convert All Receipt Downloads to Auto-Download

### Overview
Update all file download instances across the application to use the blob download pattern (auto-download) instead of opening files in new tabs. This addresses ad-blocker issues and provides a more consistent user experience.

---

### Files Requiring Changes

| File | Current Issue | Fix Needed |
|------|---------------|------------|
| `src/components/GroupedExpenseDetailModal.tsx` | Uses `window.open(blobUrl, '_blank')` after blob fetch | Change to trigger actual download via link click |
| `src/components/ExpenseDetailModal.tsx` | Uses `<a href={receiptUrl} target="_blank">` for receipt viewing | Replace with download handler function |
| `src/components/BusinessExpenseDetailModal.tsx` | Uses `<a href={receiptUrl} target="_blank">` for receipt viewing | Replace with download handler function |

---

### Technical Changes

#### 1. GroupedExpenseDetailModal.tsx (Lines 84-112)

**Current behavior:**
```tsx
const blobUrl = URL.createObjectURL(data);
window.open(blobUrl, '_blank');  // Opens in new tab
```

**New behavior:**
```tsx
const blobUrl = URL.createObjectURL(data);
const link = document.createElement('a');
// Extract filename from receiptUrl or use default
const fileName = receiptUrl.split('/').pop() || 'receipt';
link.href = blobUrl;
link.download = fileName;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
```

---

#### 2. ExpenseDetailModal.tsx (Lines 464-475)

**Current behavior:**
```tsx
<a href={receiptUrl} target="_blank" rel="noopener noreferrer">
  <ExternalLink className="h-4 w-4" />
</a>
```

**New behavior:**
- Add a `handleDownloadReceipt` function that fetches the file as a blob and triggers auto-download
- Replace the `<a>` tag with a `<button>` that calls `handleDownloadReceipt`
- Change icon from `ExternalLink` to `Download`

```tsx
const handleDownloadReceipt = async () => {
  if (!receiptUrl) return;
  try {
    const urlParts = receiptUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      // Fallback for external URLs
      window.open(receiptUrl, '_blank');
      return;
    }
    
    const [bucketName, ...pathParts] = urlParts[1].split('/');
    const filePath = pathParts.join('/');
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error || !data) {
      toast({ title: 'Download failed', variant: 'destructive' });
      return;
    }
    
    const blobUrl = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filePath.split('/').pop() || 'receipt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('Download error:', error);
    toast({ title: 'Download failed', variant: 'destructive' });
  }
};

// In JSX:
<button
  onClick={handleDownloadReceipt}
  className="text-primary hover:text-primary/80"
>
  <Download className="h-4 w-4" />
</button>
```

---

#### 3. BusinessExpenseDetailModal.tsx (Lines 255-266)

**Same pattern as ExpenseDetailModal:**
- Add `handleDownloadReceipt` function
- Replace `<a>` tag with `<button>` 
- Change icon to `Download`

---

### Files Already Correct (No Changes Needed)

The following files already use the correct blob download pattern:

| File | Pattern Used |
|------|--------------|
| `src/pages/Expenses.tsx` | Blob download with link.click() |
| `src/components/project/DocumentPreviewModal.tsx` | Blob download with link.click() |
| `src/components/project/DocumentsGallery.tsx` | Blob download with link.click() |
| `src/pages/BusinessExpenses.tsx` | CSV/JSON export with link.click() |
| `src/pages/ProjectBudget.tsx` | CSV export with link.click() |
| `src/components/project/ExportReports.tsx` | Generic downloadFile() helper |

---

### Summary of Changes

| File | Lines Changed | Nature of Change |
|------|---------------|------------------|
| `GroupedExpenseDetailModal.tsx` | 106-108 | Replace `window.open()` with link-triggered download |
| `ExpenseDetailModal.tsx` | ~464-475, add function ~85-115 | Add download handler, replace anchor with button |
| `BusinessExpenseDetailModal.tsx` | ~255-266, add function ~80-110 | Add download handler, replace anchor with button |

---

### Visual Change

- The "view receipt" action will now trigger an immediate file download rather than opening a new browser tab
- Icon changes from `ExternalLink` (arrow pointing out) to `Download` (arrow pointing down) to indicate the new behavior
- More reliable across browsers with ad-blockers or strict popup settings

