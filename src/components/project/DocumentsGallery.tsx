import { useState, useEffect, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { cn } from '@/lib/utils';

export const DOCUMENT_CATEGORIES = [
  { value: 'permit', label: 'Permit' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'lien_waiver', label: 'Lien Waiver' },
  { value: 'general', label: 'General' },
];

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
}

interface DocumentsGalleryProps {
  projectId: string;
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

const getCategoryLabel = (value: string) => {
  return DOCUMENT_CATEGORIES.find(c => c.value === value)?.label || value;
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

export function DocumentsGallery({ projectId }: DocumentsGalleryProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [allDocuments, setAllDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);

  // Get unique custom categories from all documents (not in default list)
  const customCategories = useMemo(() => {
    const defaultValues = DOCUMENT_CATEGORIES.map(c => c.value);
    const uniqueCategories = [...new Set(allDocuments.map(d => d.category))];
    return uniqueCategories.filter(cat => !defaultValues.includes(cat)).sort();
  }, [allDocuments]);

  const fetchDocuments = async () => {
    setLoading(true);
    let query = supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (filterCategory !== 'all') {
      query = query.eq('category', filterCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } else {
      let docs = (data as ProjectDocument[]) || [];
      
      // Apply date filter
      if (filterDate !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();
        if (filterDate === '7days') {
          cutoffDate.setDate(now.getDate() - 7);
        } else if (filterDate === '30days') {
          cutoffDate.setDate(now.getDate() - 30);
        }
        docs = docs.filter(d => new Date(d.created_at) >= cutoffDate);
      }
      
      setDocuments(docs);
      // Also fetch all docs for custom category derivation (without filter)
      if (filterCategory !== 'all' || filterDate !== 'all') {
        const { data: allData } = await supabase
          .from('project_documents')
          .select('*')
          .eq('project_id', projectId);
        setAllDocuments((allData as ProjectDocument[]) || []);
      } else {
        setAllDocuments(docs);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId, filterCategory, filterDate]);

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

  const handleDelete = async (doc: ProjectDocument) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('project-documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', doc.id);

    if (dbError) {
      console.error('Error deleting document:', dbError);
      toast.error('Failed to delete document');
    } else {
      toast.success('Document deleted');
      fetchDocuments();
    }
  };

  const filteredDocuments = documents;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Documents ({filteredDocuments.length})
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-[130px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Uploaded" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
              {customCategories.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1">
                    Custom
                  </div>
                  {customCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="italic">
                      {cat}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setUploadModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No documents uploaded yet</p>
            <p className="text-sm mt-1">Upload permits, contracts, invoices, and more</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredDocuments.map((doc) => {
              const fileInfo = getFileIcon(doc.file_name);
              const IconComponent = fileInfo.icon;
              const fileExt = doc.file_name.split('.').pop()?.toUpperCase() || '';

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
                  className="group relative cursor-pointer rounded-xl border border-border/30 bg-card hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden"
                >
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

                  {/* Hover Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                      onClick={(e) => handleDownload(doc, e)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <DocumentUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        projectId={projectId}
        onUploadComplete={fetchDocuments}
      />

      {selectedDocument && (
        <DocumentPreviewModal
          open={!!selectedDocument}
          onOpenChange={(open) => !open && setSelectedDocument(null)}
          document={selectedDocument}
          onUpdate={fetchDocuments}
          onDelete={() => {
            handleDelete(selectedDocument);
            setSelectedDocument(null);
          }}
        />
      )}
    </Card>
  );
}
