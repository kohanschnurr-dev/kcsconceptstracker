
## Fix: Receipt Blocked by Browser Ad-Blocker

### Problem
When clicking the paperclip icon to view a receipt, Chrome shows `ERR_BLOCKED_BY_CLIENT`. This happens because:
- Ad blockers (like uBlock Origin, AdBlock Plus) often block requests to cloud storage domains
- The direct URL `skbkqngjvbvaswijavor.supabase.co` gets flagged and blocked

### Solution
Instead of opening the storage URL directly, we'll:
1. Fetch the file through JavaScript (using `fetch()`)
2. Convert it to a Blob URL
3. Open the blob URL in a new tab

This bypasses ad blockers because the request comes from your app's code, not from a navigation event.

---

### Implementation

**File: `src/pages/Expenses.tsx`**

Add a helper function to handle receipt viewing:

```typescript
const handleViewReceipt = async (receiptUrl: string, e: React.MouseEvent) => {
  e.stopPropagation();
  
  try {
    // Fetch the file through JavaScript to bypass ad blockers
    const response = await fetch(receiptUrl);
    const blob = await response.blob();
    
    // Create a blob URL and open it
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    
    // Clean up the blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    console.error('Failed to open receipt:', error);
    // Fallback to direct URL if fetch fails
    window.open(receiptUrl, '_blank');
  }
};
```

Update the paperclip click handler:

```tsx
{expense.receipt_url && (
  <button
    onClick={(e) => handleViewReceipt(expense.receipt_url!, e)}
    className="text-primary hover:text-primary/80 transition-colors"
    title="View receipt"
  >
    <Paperclip className="h-4 w-4" />
  </button>
)}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Expenses.tsx` | Add `handleViewReceipt` helper function and update paperclip click handler |

---

### How It Works

1. User clicks the orange paperclip icon
2. JavaScript fetches the receipt file in the background
3. The file is converted to a local blob URL (`blob:https://...`)
4. The blob URL opens in a new tab
5. Ad blockers don't block blob URLs since they're local

### Expected Result
- Receipts will open successfully even with ad blockers enabled
- PDFs and images will display in a new browser tab
- Falls back to direct URL if fetching fails (for users without ad blockers)
