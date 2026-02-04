
## Plan: Fix PDF Download Being Blocked by Ad Blockers

### Problem
When clicking download, Chrome blocks the Supabase storage URL (`ERR_BLOCKED_BY_CLIENT`) because ad blockers flag direct cloud storage URLs.

### Solution
Fetch the file using the Supabase Storage SDK and download using a local blob URL instead of opening the direct URL.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/DocumentsGallery.tsx` | Update `handleDownload` to fetch blob and trigger download |
| `src/components/project/DocumentPreviewModal.tsx` | Update `handleDownload` to fetch blob and trigger download |

---

### Technical Implementation

**New download pattern (for both files):**

```typescript
const handleDownload = async (doc: ProjectDocument, e?: React.MouseEvent) => {
  e?.stopPropagation();
  
  try {
    // Fetch file as blob to avoid ad-blocker issues
    const { data, error } = await supabase.storage
      .from('project-documents')
      .download(doc.file_path);
    
    if (error || !data) {
      toast.error('Failed to download file');
      return;
    }
    
    // Create blob URL and trigger download
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download file');
  }
};
```

---

### Why This Works

| Current Approach | New Approach |
|------------------|--------------|
| Uses `getPublicUrl()` which returns Supabase URL | Uses `download()` which fetches the actual file data |
| Opens URL directly (blocked by ad blockers) | Creates local blob URL (not flagged) |
| Browser may open in new tab instead of download | Forces proper file download with `download` attribute |

---

### Result
- Downloads will work even with ad blockers enabled
- File downloads directly without opening a new tab
- Same fix applied to both the gallery hover button and preview modal
