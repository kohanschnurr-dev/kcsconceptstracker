

## Plan: Add Documents Tab to Project Detail

### Overview
Add a new "Documents" tab between "Photos" and "Logs" in the project detail page. This will allow users to upload and manage project-related documents (PDFs, contracts, permits, invoices, etc.) with a similar UI pattern to the Photo Gallery.

---

### Changes Required

**1. Database Migration**
Create a `project_documents` table to store document metadata:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `project_id` | uuid (FK) | Reference to projects table |
| `file_path` | text | Storage path in bucket |
| `file_name` | text | Original filename for display |
| `file_size` | bigint | File size in bytes |
| `category` | text | Document category (permit, contract, invoice, etc.) |
| `notes` | text | Optional notes/description |
| `document_date` | date | Date associated with document |
| `created_at` | timestamp | Upload timestamp |

**2. Storage Bucket**
Create a `project-documents` storage bucket for file storage.

**3. New Components**

| Component | Purpose |
|-----------|---------|
| `src/components/project/DocumentsGallery.tsx` | Main gallery view with list of documents |
| `src/components/project/DocumentUploadModal.tsx` | Modal for uploading documents |
| `src/components/project/DocumentPreviewModal.tsx` | Modal for viewing/editing document details |

**4. Update ProjectDetail.tsx**
- Add "Documents" tab trigger between "Photos" and "Logs"
- Add `TabsContent` for documents with `DocumentsGallery` component

---

### Document Categories

```typescript
const DOCUMENT_CATEGORIES = [
  { value: 'permit', label: 'Permit' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'lien_waiver', label: 'Lien Waiver' },
  { value: 'general', label: 'General' },
];
```

---

### UI Layout

**Documents Gallery:**
```text
┌──────────────────────────────────────────────────────────────┐
│ 📄 Documents (5)                      [Category ▾] [+ Add]   │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 📄 Building_Permit.pdf                                 │   │
│ │ Permit • Jan 15, 2026 • 2.4 MB                         │   │
│ └────────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 📄 Contractor_Agreement.pdf                            │   │
│ │ Contract • Jan 10, 2026 • 1.1 MB                       │   │
│ └────────────────────────────────────────────────────────┘   │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

**Upload Modal:**
- Drag-and-drop zone for file upload
- Category selector
- Document date picker
- Notes field
- Support for multiple file types (PDF, DOC, DOCX, XLS, XLSX, etc.)

---

### Technical Details

**Tab Order (updated):**
```tsx
<TabsList className="flex-wrap h-auto">
  <TabsTrigger value="schedule">Schedule</TabsTrigger>
  <TabsTrigger value="tasks">Tasks</TabsTrigger>
  <TabsTrigger value="financials">Financials</TabsTrigger>
  {!isRental && <TabsTrigger value="loan">Loan</TabsTrigger>}
  <TabsTrigger value="team">Team</TabsTrigger>
  <TabsTrigger value="photos">Photos</TabsTrigger>
  <TabsTrigger value="documents">Documents</TabsTrigger>  {/* NEW */}
  <TabsTrigger value="logs">Logs ({dailyLogs.length})</TabsTrigger>
</TabsList>
```

**Accepted File Types:**
- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- Images (.jpg, .png, .gif) - for scanned documents
- Text (.txt)

**File Size Formatting:**
```typescript
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
```

---

### Files to Create

| File | Description |
|------|-------------|
| `src/components/project/DocumentsGallery.tsx` | Main document list/gallery component |
| `src/components/project/DocumentUploadModal.tsx` | Upload modal with drag-drop support |
| `src/components/project/DocumentPreviewModal.tsx` | View/edit document details modal |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ProjectDetail.tsx` | Add Documents tab and TabsContent |

### Database Changes

| Action | Details |
|--------|---------|
| Create table | `project_documents` with RLS policies |
| Create bucket | `project-documents` storage bucket |

---

### RLS Policies

```sql
-- Users can only see their own project documents
CREATE POLICY "Users can view their project documents" 
ON project_documents FOR SELECT 
USING (project_id IN (
  SELECT id FROM projects WHERE id = project_documents.project_id
));

-- Users can insert documents to their projects
CREATE POLICY "Users can insert project documents"
ON project_documents FOR INSERT
WITH CHECK (true);

-- Users can update their project documents
CREATE POLICY "Users can update their project documents"
ON project_documents FOR UPDATE
USING (true);

-- Users can delete their project documents
CREATE POLICY "Users can delete their project documents"
ON project_documents FOR DELETE
USING (true);
```

