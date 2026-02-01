

## Plan: Add Manual Photo Upload for Procurement Items

### Current State
- Procurement items have an `image_url` column that currently only gets populated from scraped product URLs
- The form tracks `formData.image_url` but has no UI to manually upload or change images
- No dedicated storage bucket exists for procurement images (project-photos, bundle-covers, etc. exist)
- Existing patterns (`usePasteUpload`, `PasteableTextarea`) provide reusable file upload logic

### Proposed Solution
Add a photo upload section to the Procurement Item Modal that allows users to:
1. Upload a custom image via click-to-browse, drag-and-drop, or paste (Ctrl+V)
2. See a preview of the current image (whether scraped or uploaded)
3. Remove or replace the image at any time

### Implementation Details

#### 1. Database Migration
Create a new storage bucket for procurement item images:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('procurement-images', 'procurement-images', true);

-- RLS policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload procurement images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'procurement-images');

-- RLS policy for authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can manage procurement images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'procurement-images');

-- Public read access
CREATE POLICY "Public read access for procurement images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'procurement-images');
```

#### 2. UI Changes in ProcurementItemModal.tsx

Add a new "Product Image" section in the details step with:

| Element | Description |
|---------|-------------|
| Image preview area | Shows current image (scraped or uploaded) with fallback icon |
| Upload drop zone | Click to browse, drag-and-drop, or paste support |
| Remove button | Clears the current image |
| Loading indicator | Shows during upload |

**Location in form:** Add after the "Item Name" field and before the category-specific fields, so users see the product image prominently.

**Component structure:**
```tsx
{/* Product Image Section */}
<div className="col-span-2">
  <Label>Product Image</Label>
  <div className="flex gap-4 items-start">
    {/* Preview */}
    <div className="w-24 h-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
      {formData.image_url ? (
        <img src={formData.image_url} className="w-full h-full object-cover" />
      ) : (
        <Package className="h-8 w-8 text-muted-foreground" />
      )}
    </div>
    
    {/* Upload zone */}
    <div 
      className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm">Drop image or click to browse</p>
      <p className="text-xs text-muted-foreground">Ctrl+V to paste</p>
    </div>
  </div>
  
  {formData.image_url && (
    <Button variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}>
      Remove image
    </Button>
  )}
</div>
```

#### 3. Upload Logic

Add these handlers to the modal:

```typescript
const fileInputRef = useRef<HTMLInputElement>(null);
const [imageUploading, setImageUploading] = useState(false);

const uploadImage = async (file: File) => {
  setImageUploading(true);
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from('procurement-images')
    .upload(fileName, file);
  
  if (!error) {
    const { data } = supabase.storage.from('procurement-images').getPublicUrl(fileName);
    setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
    toast.success('Image uploaded');
  }
  setImageUploading(false);
};

// Handle paste events for the modal
useEffect(() => {
  if (!open || step !== 'details') return;
  
  const handlePaste = (e: ClipboardEvent) => {
    for (const item of e.clipboardData?.items || []) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadImage(file);
        break;
      }
    }
  };
  
  document.addEventListener('paste', handlePaste);
  return () => document.removeEventListener('paste', handlePaste);
}, [open, step]);
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/procurement/ProcurementItemModal.tsx` | Add image upload UI section, paste/drag handlers, upload logic |
| New migration | Create `procurement-images` storage bucket with RLS policies |

### User Experience

1. **New items without URL**: User can upload their own photo immediately
2. **Scraped items**: Scraped image appears in preview; user can replace it with their own
3. **Editing existing items**: Current image shown; user can upload a new one or remove it
4. **Multiple input methods**: Click to browse, drag-and-drop, or Ctrl+V paste

