

## Enhanced Photo Gallery - Multi-Upload & Better Organization

### What This Does
Transforms the photo gallery upload experience from single-file to a modern, efficient multi-file system with better organization features including date tagging, drag & drop, paste support, and bulk editing.

---

### Current Behavior
- Upload one photo at a time through a file picker
- Must set category and caption BEFORE selecting the file
- No drag & drop support
- No paste-to-upload support
- No date tracking (only `created_at` timestamp)
- No progress indicator for uploads
- Cannot edit caption/category after upload
- Basic file picker UI

### New Behavior
- Select multiple files at once (hold Ctrl/Cmd)
- Drag & drop multiple images directly onto the gallery
- Paste images from clipboard (Ctrl+V)
- Assign a specific photo date (when the photo was taken)
- Add/edit captions after upload
- See upload progress for each file
- Bulk category assignment for multiple photos
- Preview thumbnails before uploading
- Filter by date range in addition to category

---

### Technical Implementation

#### 1. Database Schema Update

Add a `photo_date` column to track when photos were taken (separate from `created_at` which is when uploaded):

```sql
ALTER TABLE project_photos 
ADD COLUMN photo_date DATE DEFAULT CURRENT_DATE;
```

#### 2. Enhanced Upload Modal

Redesign the upload dialog with a two-step process:

**Step 1: File Selection**
- Large drag & drop zone with visual feedback
- Support `multiple` attribute on file input
- Paste listener for clipboard images
- Show thumbnail previews of selected files

**Step 2: Metadata Assignment**
- Grid of selected file thumbnails
- Global category selector (applies to all)
- Per-photo caption input
- Photo date picker (defaults to today)
- Option to apply same caption to all or individual

```text
┌──────────────────────────────────────────────────┐
│  Upload Photos                               X   │
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐  │
│  │                                            │  │
│  │     📁 Drop photos here or click to        │  │
│  │        browse (Ctrl+V to paste)            │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Selected (3 photos):                            │
│  ┌─────┐ ┌─────┐ ┌─────┐                        │
│  │ img │ │ img │ │ img │  ← Thumbnail previews  │
│  │  1  │ │  2  │ │  3  │                        │
│  └──X──┘ └──X──┘ └──X──┘  ← Remove individual   │
│                                                  │
│  Category: [Before ▼]    Date: [📅 Jan 31]      │
│                                                  │
│  Caption: [___________________________]          │
│  ☑ Apply same caption to all photos             │
│                                                  │
│  [Cancel]                    [Upload 3 Photos]  │
└──────────────────────────────────────────────────┘
```

#### 3. Upload Progress

Show real-time progress for multi-file uploads:

```text
┌──────────────────────────────────────────────────┐
│  Uploading 3 photos...                           │
│  ━━━━━━━━━━━━━━━░░░░░░░░░░  2 of 3               │
│                                                  │
│  ✓ photo1.jpg                                    │
│  ✓ photo2.jpg                                    │
│  ⏳ photo3.jpg (uploading...)                    │
└──────────────────────────────────────────────────┘
```

#### 4. Enhanced Gallery Display

Update the photo cards to show more metadata:

- Display photo date badge (in addition to category)
- Show caption preview on hover
- Add date filter option (e.g., "Last 7 days", "This month", or date range)

#### 5. Inline Caption Editing

When viewing a photo in the preview modal:
- Click caption to edit inline
- Click category badge to change category
- Add "Edit Date" option

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/XXX_add_photo_date.sql` | Create | Add `photo_date` column to project_photos |
| `src/components/project/PhotoGallery.tsx` | Major Modify | Complete rewrite of upload flow |
| `src/components/project/PhotoUploadModal.tsx` | Create | New dedicated upload modal component |

---

### Detailed Component Changes

#### PhotoUploadModal.tsx (New)
```typescript
interface PhotoUploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

// Features:
// - pendingFiles: File[] state for selected files
// - thumbnailPreviews: generated via URL.createObjectURL()
// - globalCategory, globalCaption, photoDate states
// - handleDrop, handlePaste, handleFileSelect handlers
// - Sequential upload with progress tracking
// - Cleanup object URLs on unmount
```

#### PhotoGallery.tsx Updates
- Add date filter dropdown (All / Last 7 days / Last 30 days / Custom range)
- Update photo card to show date badge
- Add inline caption editing in preview modal
- Add edit category functionality in preview modal
- Update query to include photo_date and order options

---

### Recommended Additional Features

1. **Bulk Delete**: Select multiple photos to delete at once
2. **Photo Reordering**: Drag to reorder photos within a category
3. **Download Original**: Button to download the original high-res image
4. **Lightbox Navigation**: Arrow keys to navigate between photos in preview
5. **Photo Notes**: Longer notes field separate from caption (for internal use)

---

### Summary

- Database migration to add `photo_date` column
- New `PhotoUploadModal` component with multi-file support
- Enhanced `PhotoGallery` with drag & drop, paste, progress indicators
- Date filtering and display
- Inline editing of caption/category after upload
- Better UX with thumbnail previews before upload

