import { useState } from 'react';
import { FileText, Download, ExternalLink, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DOCUMENT_CATEGORIES } from './DocumentsGallery';

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
  title: string | null;
}

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ProjectDocument;
  onUpdate: () => void;
  onDelete: () => void;
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

export function DocumentPreviewModal({
  open,
  onOpenChange,
  document,
  onUpdate,
  onDelete,
}: DocumentPreviewModalProps) {
  // Check if current category is custom (not in default list)
  const defaultCategoryValues = DOCUMENT_CATEGORIES.map(c => c.value);
  const isInitiallyCustom = !defaultCategoryValues.includes(document.category);
  
  const [title, setTitle] = useState(document.title || '');
  const [category, setCategory] = useState(isInitiallyCustom ? '' : document.category);
  const [isCustomCategory, setIsCustomCategory] = useState(isInitiallyCustom);
  const [customCategoryName, setCustomCategoryName] = useState(isInitiallyCustom ? document.category : '');
  const [documentDate, setDocumentDate] = useState(
    document.document_date || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(document.notes || '');
  const [saving, setSaving] = useState(false);

  const handleCategoryChange = (value: string) => {
    if (value === 'other') {
      setIsCustomCategory(true);
      setCategory('');
    } else {
      setIsCustomCategory(false);
      setCategory(value);
    }
  };

  const finalCategory = isCustomCategory ? customCategoryName.trim() : category;

  const hasChanges =
    title !== (document.title || '') ||
    finalCategory !== document.category ||
    documentDate !== document.document_date ||
    notes !== (document.notes || '');

  const canSave = !isCustomCategory || customCategoryName.trim().length > 0;

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('project_documents')
      .update({
        title: title.trim() || null,
        category: finalCategory,
        document_date: documentDate,
        notes: notes || null,
      })
      .eq('id', document.id);

    if (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    } else {
      toast.success('Document updated');
      onUpdate();
      onOpenChange(false);
    }

    setSaving(false);
  };

  const handleOpen = () => {
    const { data } = supabase.storage
      .from('project-documents')
      .getPublicUrl(document.file_path);

    window.open(data.publicUrl, '_blank');
  };

  const handleDownload = async () => {
    try {
      // Fetch file as blob to avoid ad-blocker issues
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(document.file_path);
      
      if (error || !data) {
        toast.error('Failed to download file');
        return;
      }
      
      // Create blob URL and trigger download
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File info */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="font-medium truncate mb-1">{document.title || document.file_name}</p>
            <p className="text-sm text-muted-foreground">
              📎 {document.file_name} • {formatFileSize(document.file_size)}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleOpen}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              placeholder="e.g., Foundation Warranty, Final Invoice..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={isCustomCategory ? 'other' : category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
                <SelectItem value="other" className="border-t mt-1 pt-1">
                  + Other (custom)...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Category Input */}
          {isCustomCategory && (
            <div className="space-y-2">
              <Label>Custom Category Name</Label>
              <Input
                placeholder="e.g., Warranty, Change Order, Quote..."
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label>Document Date</Label>
            <Input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add notes about this document..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Delete this document?')) {
                  onDelete();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !hasChanges || !canSave}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
