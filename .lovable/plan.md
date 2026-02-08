

## Plan: Add Download Button for Pending Receipts

### Overview
Add a download button to receipts in the "Awaiting Bank Transaction" state so you can save the receipt images locally for backup purposes. This ensures you have a copy even if you leave for a week and don't remember what was uploaded.

---

### Current State vs. Proposed

| State | Current Actions | Proposed Actions |
|-------|----------------|------------------|
| Awaiting Bank Transaction | Delete only | **Download** + Delete |
| Matched receipts | Import, Delete | (unchanged) |

---

### Changes

**File: `src/components/SmartSplitReceiptUpload.tsx`**

#### 1. Add Download icon to imports (Line 2)

Add `Download` to the lucide-react import:
```tsx
import { Upload, FileImage, Loader2, Receipt, Trash2, Check, X, Sparkles, ChevronDown, ChevronUp, AlertCircle, Clipboard, Package, Wrench, Link2, Building, CalendarIcon, Home, Building2, Download } from 'lucide-react';
```

#### 2. Add download receipt handler function (after deleteReceipt function, around line 550)

```tsx
// Download receipt image
const downloadReceipt = async (receiptImageUrl: string, vendorName: string) => {
  if (!receiptImageUrl) return;
  
  try {
    const urlParts = receiptImageUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      // Fallback: direct download
      const link = document.createElement('a');
      link.href = receiptImageUrl;
      link.download = `receipt-${vendorName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    const [bucketName, ...pathParts] = urlParts[1].split('/');
    const filePath = pathParts.join('/');
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error || !data) {
      console.error('Failed to download receipt:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download receipt image',
        variant: 'destructive',
      });
      return;
    }
    
    const blobUrl = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filePath.split('/').pop() || `receipt-${vendorName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('Failed to download receipt:', error);
    toast({
      title: 'Download failed',
      variant: 'destructive',
    });
  }
};
```

#### 3. Add Download button next to Trash button (around line 1098-1106)

Change from:
```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={() => deleteReceipt(receipt.id)}
  className="text-muted-foreground hover:text-destructive shrink-0"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

To:
```tsx
<div className="flex items-center gap-1 shrink-0">
  {receipt.receipt_image_url && (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => downloadReceipt(receipt.receipt_image_url!, receipt.vendor_name)}
      className="text-muted-foreground hover:text-primary"
      title="Download receipt"
    >
      <Download className="h-4 w-4" />
    </Button>
  )}
  <Button
    size="sm"
    variant="ghost"
    onClick={() => deleteReceipt(receipt.id)}
    className="text-muted-foreground hover:text-destructive"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

---

### Visual Result

```text
Before:
┌─────────────────────────────────────────────────┐
│ 🖼️ Amazon                                   🗑️ │
│ $16.23 • Feb 7, 2026 • 1 items parsed          │
│ [Link Transaction...]                           │
└─────────────────────────────────────────────────┘

After:
┌─────────────────────────────────────────────────┐
│ 🖼️ Amazon                               ⬇️ 🗑️ │
│ $16.23 • Feb 7, 2026 • 1 items parsed          │
│ [Link Transaction...]                           │
└─────────────────────────────────────────────────┘
```

---

### Behavior

- Download button appears only if `receipt_image_url` exists
- Uses the existing programmatic blob-download pattern (per project standards)
- Downloads as a file to the user's device (not opening in new tab)
- Filename includes vendor name for easy identification

