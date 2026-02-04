
## Plan: Force Download Instead of Opening Receipt in New Tab

### Problem
When clicking the paperclip icon to view receipts, the file opens in a new browser tab which can trigger ad-blocker errors. The user wants the file to download directly instead.

### Solution
Change the `handleViewReceipt` function in `src/pages/Expenses.tsx` to trigger a file download instead of opening in a new tab. This is done by:
1. Creating a temporary anchor (`<a>`) element
2. Setting the `download` attribute with the filename
3. Programmatically clicking it to trigger the browser's download behavior

### Technical Changes

**File: `src/pages/Expenses.tsx`**

Update the `handleViewReceipt` function to use the download approach:

```typescript
const handleViewReceipt = async (receiptUrl: string, e: React.MouseEvent) => {
  e.stopPropagation();
  
  try {
    const urlParts = receiptUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      // Fallback - trigger download via anchor
      const link = document.createElement('a');
      link.href = receiptUrl;
      link.download = 'receipt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const [bucketName, ...pathParts] = urlParts[1].split('/');
    const filePath = pathParts.join('/');
    const fileName = pathParts[pathParts.length - 1] || 'receipt';
    
    // Use Supabase SDK to download the file (bypasses ad blockers)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error || !data) {
      console.error('Failed to download receipt:', error);
      return;
    }
    
    // Create blob URL and trigger download
    const blobUrl = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('Failed to download receipt:', error);
  }
};
```

### Key Changes
| Before | After |
|--------|-------|
| `window.open(blobUrl, '_blank')` | Create `<a download>` element and click it |
| Opens in new tab | Downloads file directly |
| Subject to ad-blocker popup blocking | Uses native download behavior |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/Expenses.tsx` | Update `handleViewReceipt` to trigger download instead of opening new tab |

### Expected Behavior
- Clicking the paperclip icon downloads the receipt file directly
- No new tab opens
- Bypasses ad-blocker issues completely
- File saves with original filename
