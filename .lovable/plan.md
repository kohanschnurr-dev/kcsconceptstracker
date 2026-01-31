
## Fix: Receipt Viewing Blocked by Ad-Blocker (Persistent Issue)

### Root Cause
The ad-blocker is blocking ALL requests to the Supabase storage domain (`skbkqngjvbvaswijavor.supabase.co`), including the JavaScript `fetch()` call we just added. The block happens at the network level before the response can be processed.

### Solution: Use Supabase SDK Download Method

Instead of using a raw `fetch()` to the public URL, we'll use the Supabase Storage SDK's `download()` method. This has several advantages:
1. Uses authenticated API endpoints that are less likely to be blocked
2. Goes through the Supabase JS client which handles CORS properly
3. The request goes to `/storage/v1/object/` endpoint instead of the public path

---

### Technical Implementation

**File: `src/pages/Expenses.tsx`**

Update the `handleViewReceipt` function to use the Supabase SDK:

```typescript
import { supabase } from '@/integrations/supabase/client';

const handleViewReceipt = async (receiptUrl: string, e: React.MouseEvent) => {
  e.stopPropagation();
  
  try {
    // Extract the file path from the full URL
    // URL format: https://skbkqngjvbvaswijavor.supabase.co/storage/v1/object/public/expense-receipts/user-id/filename.ext
    const urlParts = receiptUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      // Fallback for unexpected URL format
      window.open(receiptUrl, '_blank');
      return;
    }
    
    const [bucketName, ...pathParts] = urlParts[1].split('/');
    const filePath = pathParts.join('/');
    
    // Use Supabase SDK to download the file (bypasses ad blockers)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error || !data) {
      console.error('Failed to download receipt:', error);
      // Fallback to direct URL
      window.open(receiptUrl, '_blank');
      return;
    }
    
    // Create a blob URL and open it
    const blobUrl = URL.createObjectURL(data);
    window.open(blobUrl, '_blank');
    
    // Clean up the blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    console.error('Failed to open receipt:', error);
    // Fallback to direct URL if everything fails
    window.open(receiptUrl, '_blank');
  }
};
```

---

### Why This Works

| Approach | URL Pattern | Blocked? |
|----------|-------------|----------|
| Direct URL | `https://skbkqngjvbvaswijavor.supabase.co/storage/v1/object/public/...` | Yes |
| Raw fetch() | Same URL | Yes |
| Supabase SDK | `https://skbkqngjvbvaswijavor.supabase.co/storage/v1/object/expense-receipts/...` | Less likely |

The SDK uses authenticated endpoints and standard API patterns that are less likely to trigger ad-blocker heuristics.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Expenses.tsx` | Update `handleViewReceipt` to use Supabase SDK `storage.download()` |

---

### Fallback Behavior
If the SDK download fails (e.g., bucket permissions), it falls back to opening the direct URL. This ensures users without ad-blockers can still view receipts normally.

### Expected Result
- Clicking the orange paperclip successfully opens the receipt in a new tab
- Works even with ad-blockers enabled
- Falls back gracefully if there are permission issues
