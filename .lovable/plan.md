

## Plan: Add Custom Title Field to Documents

### Overview
Add a `title` field to documents so users can give them descriptive names like "Isias Foundation Warranty" while preserving the original file name (e.g., "IJ warranty.pdf") visible in the detail modal.

---

### UI Changes

**Document Card Display:**
```text
┌──────────────┐        ┌──────────────┐
│    📄 PDF    │        │    📄 PDF    │
├──────────────┤        ├──────────────┤
│ IJ warranty  │   →    │ Isias        │  ← Now shows title
│              │        │ Foundation   │
│              │        │ Warranty     │
│ General      │        │ General      │
└──────────────┘        └──────────────┘
```

**Document Preview Modal (when clicked):**
```text
┌─────────────────────────────────────────┐
│ 📄 Document Details                     │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Isias Foundation Warranty           │ │ ← Title (editable)
│ │ 📎 IJ warranty.pdf • 430.9 KB       │ │ ← Original file name shown
│ └─────────────────────────────────────┘ │
│                                         │
│ [Open]  [Download]                      │
│                                         │
│ Title: [Isias Foundation Warranty    ]  │ ← New editable field
│ Category: [Permit ▾]                    │
│ Date: [Feb 3, 2026]                     │
│ Notes: [________________]               │
└─────────────────────────────────────────┘
```

**Upload Modal:**
- Add optional "Title" input field above category
- If left empty, defaults to showing file name

---

### Database Changes

**Add column to `project_documents`:**

| Column | Type | Description |
|--------|------|-------------|
| title | text (nullable) | Custom display title, defaults to null (shows file_name if null) |

---

### Technical Implementation

**1. Database Migration:**

```sql
-- Add title column to project_documents
ALTER TABLE public.project_documents
ADD COLUMN title TEXT DEFAULT NULL;
```

**2. Update DraggableDocumentCard.tsx:**

- Display `doc.title || doc.file_name` as the main text
- If title exists, truncate nicely; if not, show file_name as before

**3. Update DocumentPreviewModal.tsx:**

- Show title as editable field
- Display original file name below it (read-only info)
- Add title to the update mutation

**4. Update DocumentUploadModal.tsx:**

- Add optional "Title" input field
- Placeholder: "e.g., Foundation Warranty, Final Invoice..."
- Include title in the insert

**5. Update DocumentsGallery.tsx:**

- Update ProjectDocument interface to include `title: string | null`
- Update desktop drop handler to set title as null (uses file_name by default)

---

### Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add `title` column |
| `DraggableDocumentCard.tsx` | Display title over file_name, update interface |
| `DocumentPreviewModal.tsx` | Add title input, show file name as secondary info |
| `DocumentUploadModal.tsx` | Add optional title input field |
| `DocumentsGallery.tsx` | Update interface to include title |

---

### User Flow

1. **Upload with title**: User uploads a file, optionally types "Isias Foundation Warranty" → Title saved
2. **Upload without title**: User uploads without title → Card shows file name as before
3. **Edit title later**: Click document → Edit title field → Save
4. **View original file name**: Always visible in the detail modal header

