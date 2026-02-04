

## Plan: Enhanced Documents Gallery with Library/Folder Design

### Overview
Transform the Documents Gallery to have a more visual "library folder" look with file type icons, enhanced metadata display (upload date, document date, notes preview), and a card-based grid layout similar to file managers.

---

### Current State vs. New Design

| Current | New |
|---------|-----|
| Simple list rows | Card-based grid with folder/file visual |
| Single FileText icon | Dynamic icons based on file type (PDF, Word, Excel, Image) |
| Limited metadata shown | Upload date, document date, category badge, file size, notes preview |
| Linear layout | Responsive grid with visual file cards |

---

### UI Design

**Card Layout for Each Document:**
```text
┌─────────────────────────────┐
│   ┌───────────────────┐     │
│   │                   │     │
│   │   📄 PDF Icon     │     │  ← Large file type icon with extension badge
│   │                   │     │
│   │      .PDF         │     │
│   └───────────────────┘     │
│                             │
│  Building_Permit.pdf        │  ← File name (truncated)
│  ────────────────────────── │
│  📁 Permit                  │  ← Category badge
│  📅 Jan 16, 2026            │  ← Document date
│  ⬆️ Uploaded 2 days ago     │  ← Relative upload time
│  💾 2.4 MB                  │  ← File size
│                             │
│  "Approved for foundation…" │  ← Notes preview (if any)
└─────────────────────────────┘
```

**Gallery Grid View:**
```text
┌────────────────────────────────────────────────────────────────────┐
│ 📂 Documents (8)                      [Category ▾] [Date ▾] [+ Add]│
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│ │ 📄 PDF   │  │ 📊 XLS   │  │ 📝 DOC   │  │ 🖼️ IMG   │             │
│ │          │  │          │  │          │  │          │             │
│ │ Permit   │  │ Budget   │  │ Contract │  │ Scan     │             │
│ │ Jan 16   │  │ Jan 12   │  │ Jan 10   │  │ Jan 8    │             │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
└────────────────────────────────────────────────────────────────────┘
```

---

### Technical Changes

**1. File Type Icon Function:**

```typescript
import { 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File,
  FolderOpen 
} from 'lucide-react';

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return { icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' };
    case 'doc':
    case 'docx':
      return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    case 'xls':
    case 'xlsx':
      return { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-500/10' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-500/10' };
    default:
      return { icon: File, color: 'text-muted-foreground', bg: 'bg-muted' };
  }
};
```

**2. Relative Time for Upload Date:**

```typescript
const getRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
};
```

**3. New Card Grid Layout:**

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
  {filteredDocuments.map((doc) => {
    const fileInfo = getFileIcon(doc.file_name);
    const IconComponent = fileInfo.icon;
    const fileExt = doc.file_name.split('.').pop()?.toUpperCase() || '';
    
    return (
      <div
        key={doc.id}
        onClick={() => setSelectedDocument(doc)}
        className="group cursor-pointer rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden"
      >
        {/* File Icon Area */}
        <div className={cn("flex flex-col items-center justify-center py-6 px-4", fileInfo.bg)}>
          <IconComponent className={cn("h-12 w-12", fileInfo.color)} />
          <span className={cn("text-xs font-bold mt-1", fileInfo.color)}>
            .{fileExt}
          </span>
        </div>
        
        {/* Info Area */}
        <div className="p-3 space-y-2">
          {/* File Name */}
          <p className="font-medium text-sm truncate" title={doc.file_name}>
            {doc.file_name}
          </p>
          
          {/* Category Badge */}
          <Badge variant="secondary" className="text-xs">
            {getCategoryLabel(doc.category)}
          </Badge>
          
          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {doc.document_date ? formatDate(doc.document_date) : 'No date'}
            </div>
            <div className="flex items-center gap-1">
              <Upload className="h-3 w-3" />
              {getRelativeTime(doc.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {formatFileSize(doc.file_size)}
            </div>
          </div>
          
          {/* Notes Preview */}
          {doc.notes && (
            <p className="text-xs text-muted-foreground italic line-clamp-2 border-t pt-2 mt-2">
              "{doc.notes}"
            </p>
          )}
        </div>
        
        {/* Hover Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  })}
</div>
```

---

### Additional Enhancements

| Feature | Description |
|---------|-------------|
| Date filter | Add "Uploaded" filter similar to Photo Gallery (All, Last 7 days, Last 30 days) |
| Sort options | Add sorting by name, date, or upload time |
| Folder icon header | Use FolderOpen icon in card header for visual library feel |
| Empty state | Enhanced empty state with folder illustration |
| Hover effects | Subtle shadow and border highlight on hover |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/DocumentsGallery.tsx` | Complete redesign with card grid, file icons, enhanced metadata, date filter |

---

### New Imports Needed

```typescript
import { 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File,
  FolderOpen,
  Plus, 
  Filter, 
  Loader2, 
  Download, 
  Trash2, 
  Calendar,
  Upload,
  HardDrive,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
```

---

### Responsive Behavior

| Screen Size | Columns |
|-------------|---------|
| Mobile (< 640px) | 2 columns |
| Tablet (640-768px) | 3 columns |
| Desktop (768-1024px) | 4 columns |
| Large (> 1024px) | 5 columns |

---

### Result

| Before | After |
|--------|-------|
| Simple list view | Visual card grid like a file manager |
| Single generic icon | Color-coded icons by file type |
| Upload date only | Both document date and relative upload time |
| No notes shown | Notes preview in card |
| Basic hover | Enhanced hover with shadow + actions |

