import { useState, useEffect } from 'react';
import { FileText, Plus, Filter, Loader2, Download, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';

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

const getCategoryLabel = (value: string) => {
  return DOCUMENT_CATEGORIES.find(c => c.value === value)?.label || value;
};

export function DocumentsGallery({ projectId }: DocumentsGalleryProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);

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
      setDocuments((data as ProjectDocument[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId, filterCategory]);

  const handleDownload = async (doc: ProjectDocument) => {
    const { data } = supabase.storage
      .from('project-documents')
      .getPublicUrl(doc.file_path);

    window.open(data.publicUrl, '_blank');
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
          <FileText className="h-5 w-5" />
          Documents ({filteredDocuments.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
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
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents uploaded yet</p>
            <p className="text-sm">Upload permits, contracts, invoices, and more</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedDocument(doc)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-8 w-8 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryLabel(doc.category)} • {doc.document_date ? formatDate(doc.document_date) : formatDate(doc.created_at)} • {formatFileSize(doc.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this document?')) {
                        handleDelete(doc);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
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
