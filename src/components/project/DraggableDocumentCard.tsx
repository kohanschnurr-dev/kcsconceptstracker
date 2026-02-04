import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File,
  Download, 
  Calendar,
  Upload,
  HardDrive,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProjectDocument {
  id: string;
  project_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  category: string;
  notes: string | null;
  document_date: string | null;
  created_at: string;
  folder_id: string | null;
}

interface DraggableDocumentCardProps {
  doc: ProjectDocument;
  onSelect: () => void;
  onDownload: (e: React.MouseEvent) => void;
  getCategoryLabel: (value: string) => string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return formatDate(dateStr);
};

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

export function DraggableDocumentCard({ 
  doc, 
  onSelect, 
  onDownload,
  getCategoryLabel 
}: DraggableDocumentCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: doc.id,
    data: { type: 'document', document: doc },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  } : undefined;

  const fileInfo = getFileIcon(doc.file_name);
  const IconComponent = fileInfo.icon;
  const fileExt = doc.file_name.split('.').pop()?.toUpperCase() || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-border/30 bg-card hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden",
        isDragging && "shadow-2xl ring-2 ring-primary"
      )}
    >
      {/* Drag Handle */}
      <div 
        {...listeners} 
        {...attributes}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <div className="p-1 rounded bg-background/80 backdrop-blur-sm">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Click area for opening preview */}
      <div onClick={onSelect}>
        {/* File Icon Area */}
        <div className={cn("flex flex-col items-center justify-center py-6 px-4", fileInfo.bg)}>
          <IconComponent className={cn("h-12 w-12", fileInfo.color)} />
          <span className={cn("text-xs font-bold mt-1 uppercase", fileInfo.color)}>
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
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{doc.document_date ? formatDate(doc.document_date) : 'No date'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Upload className="h-3 w-3 shrink-0" />
              <span className="truncate">{getRelativeTime(doc.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3 shrink-0" />
              <span>{formatFileSize(doc.file_size)}</span>
            </div>
          </div>

          {/* Notes Preview */}
          {doc.notes && (
            <p className="text-xs text-muted-foreground italic line-clamp-2 border-t border-border/30 pt-2 mt-2">
              "{doc.notes}"
            </p>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 bg-background/80 backdrop-blur-sm"
          onClick={onDownload}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
