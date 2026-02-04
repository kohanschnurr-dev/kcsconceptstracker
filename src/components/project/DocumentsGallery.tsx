import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FolderOpen,
  Plus, 
  Filter, 
  Loader2, 
  Clock,
  ArrowLeft,
  FolderPlus,
  Folder,
  Upload
} from 'lucide-react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  pointerWithin,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { CreateFolderModal } from './CreateFolderModal';
import { DraggableDocumentCard } from './DraggableDocumentCard';
import { DroppableFolder } from './DroppableFolder';
import { RootDropZone } from './RootDropZone';
import { FolderTargetBar } from './FolderTargetBar';

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
];

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
  folder_id: string | null;
}

interface DocumentFolder {
  id: string;
  project_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentsGalleryProps {
  projectId: string;
}

const getCategoryLabel = (value: string) => {
  return DOCUMENT_CATEGORIES.find(c => c.value === value)?.label || value;
};

export function DocumentsGallery({ projectId }: DocumentsGalleryProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [allDocuments, setAllDocuments] = useState<ProjectDocument[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // Folder management states
  const [deleteFolderDialog, setDeleteFolderDialog] = useState<DocumentFolder | null>(null);
  const [renameFolderDialog, setRenameFolderDialog] = useState<DocumentFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Desktop drag-and-drop states
  const [desktopDragActive, setDesktopDragActive] = useState(false);
  const [uploadingDesktopFiles, setUploadingDesktopFiles] = useState(false);

  const currentFolder = useMemo(() => 
    folders.find(f => f.id === currentFolderId) || null
  , [folders, currentFolderId]);

  // Get document counts per folder
  const folderDocumentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allDocuments.forEach(doc => {
      if (doc.folder_id) {
        counts[doc.folder_id] = (counts[doc.folder_id] || 0) + 1;
      }
    });
    return counts;
  }, [allDocuments]);

  // Get unique custom categories from all documents
  const customCategories = useMemo(() => {
    const defaultValues = DOCUMENT_CATEGORIES.map(c => c.value);
    const uniqueCategories = [...new Set(allDocuments.map(d => d.category))];
    return uniqueCategories.filter(cat => !defaultValues.includes(cat)).sort();
  }, [allDocuments]);

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('document_folders')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) {
      console.error('Error fetching folders:', error);
    } else {
      setFolders((data as DocumentFolder[]) || []);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    
    // Fetch all documents for counts
    const { data: allData, error: allError } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('Error fetching documents:', allError);
      toast.error('Failed to load documents');
      setLoading(false);
      return;
    }

    setAllDocuments((allData as ProjectDocument[]) || []);

    // Filter for current view
    let filteredDocs = (allData as ProjectDocument[]) || [];
    
    // Filter by folder
    filteredDocs = filteredDocs.filter(d => d.folder_id === currentFolderId);

    // Filter by category
    if (filterCategory !== 'all') {
      filteredDocs = filteredDocs.filter(d => d.category === filterCategory);
    }

    // Filter by date
    if (filterDate !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      if (filterDate === '7days') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filterDate === '30days') {
        cutoffDate.setDate(now.getDate() - 30);
      }
      filteredDocs = filteredDocs.filter(d => new Date(d.created_at) >= cutoffDate);
    }

    setDocuments(filteredDocs);
    setLoading(false);
  };

  useEffect(() => {
    fetchFolders();
  }, [projectId]);

  useEffect(() => {
    fetchDocuments();
  }, [projectId, filterCategory, filterDate, currentFolderId]);

  const handleDownload = async (doc: ProjectDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(doc.file_path);
      
      if (error || !data) {
        toast.error('Failed to download file');
        return;
      }
      
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
    const { error: storageError } = await supabase.storage
      .from('project-documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

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

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const documentId = active.id as string;
    const overId = over.id as string;

    // Dropped on a folder
    if (overId.startsWith('folder-')) {
      const folderId = overId.replace('folder-', '');
      const { error } = await supabase
        .from('project_documents')
        .update({ folder_id: folderId })
        .eq('id', documentId);

      if (error) {
        toast.error('Failed to move document');
      } else {
        toast.success('Document moved to folder');
        fetchDocuments();
      }
    }

    // Dropped on root zone
    if (overId === 'root-drop-zone') {
      const { error } = await supabase
        .from('project_documents')
        .update({ folder_id: null })
        .eq('id', documentId);

      if (error) {
        toast.error('Failed to move document');
      } else {
        toast.success('Document moved to root');
        fetchDocuments();
      }
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderDialog) return;

    const { error } = await supabase
      .from('document_folders')
      .delete()
      .eq('id', deleteFolderDialog.id);

    if (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    } else {
      toast.success('Folder deleted (documents moved to root)');
      if (currentFolderId === deleteFolderDialog.id) {
        setCurrentFolderId(null);
      }
      fetchFolders();
      fetchDocuments();
    }
    setDeleteFolderDialog(null);
  };

  const handleRenameFolder = async () => {
    if (!renameFolderDialog || !newFolderName.trim()) return;

    const { error } = await supabase
      .from('document_folders')
      .update({ name: newFolderName.trim() })
      .eq('id', renameFolderDialog.id);

    if (error) {
      console.error('Error renaming folder:', error);
      toast.error('Failed to rename folder');
    } else {
      toast.success('Folder renamed');
      fetchFolders();
    }
    setRenameFolderDialog(null);
    setNewFolderName('');
  };

  // Configure drag sensors with distance constraint for click-to-open, hold-to-drag UX
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag activates
      },
    })
  );

  const activeDragDocument = activeDragId 
    ? allDocuments.find(d => d.id === activeDragId) 
    : null;

  const totalCount = currentFolderId 
    ? documents.length 
    : allDocuments.filter(d => !d.folder_id).length + folders.length;

  // Desktop drag-and-drop handlers (native HTML5, separate from dnd-kit)
  const handleDesktopDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only activate for actual file drops from desktop
    if (e.dataTransfer.types.includes('Files')) {
      setDesktopDragActive(true);
    }
  }, []);

  const handleDesktopDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDesktopDragActive(false);
    }
  }, []);

  const handleDesktopDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDesktopDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => 
      ACCEPTED_FILE_TYPES.includes(f.type)
    );
    
    if (files.length === 0) {
      toast.error('No supported files found');
      return;
    }
    
    setUploadingDesktopFiles(true);
    
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('project-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Insert record with defaults
        const { error: dbError } = await supabase.from('project_documents').insert({
          project_id: projectId,
          file_path: fileName,
          file_name: file.name,
          file_size: file.size,
          category: 'general',
          document_date: new Date().toISOString().split('T')[0],
          notes: null,
          folder_id: currentFolderId || null,
        });

        if (dbError) {
          console.error('DB error:', dbError);
          toast.error(`Failed to save ${file.name}`);
        }
      }

      toast.success(`${files.length} file(s) uploaded`);
      fetchDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploadingDesktopFiles(false);
    }
  }, [projectId, currentFolderId]);

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          {currentFolder ? (
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentFolderId(null)}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <CardTitle className="text-lg flex items-center gap-2">
                <Folder className="h-5 w-5 text-amber-500" />
                {currentFolder.name} ({documents.length})
              </CardTitle>
            </div>
          ) : (
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Documents ({totalCount})
            </CardTitle>
          )}
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
            {!currentFolderId && (
              <Button size="sm" variant="outline" onClick={() => setFolderModalOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-1" />
                Folder
              </Button>
            )}
            <Button size="sm" onClick={() => setUploadModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent 
          onDragOver={handleDesktopDragOver}
          onDragLeave={handleDesktopDragLeave}
          onDrop={handleDesktopDrop}
          className="relative"
        >
          {/* Desktop drop zone overlay */}
          {(desktopDragActive || uploadingDesktopFiles) && (
            <div className="absolute inset-0 z-20 bg-primary/5 border-2 border-dashed border-primary rounded-lg flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                {uploadingDesktopFiles ? (
                  <>
                    <Loader2 className="h-12 w-12 mx-auto mb-3 text-primary animate-spin" />
                    <p className="text-lg font-medium text-primary">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto mb-3 text-primary" />
                    <p className="text-lg font-medium text-primary">Drop files to upload</p>
                    <p className="text-sm text-muted-foreground">PDF, Word, Excel, Images, Text</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Folder target bar - shows when dragging a document inside a folder */}
          <FolderTargetBar 
            folders={folders} 
            currentFolderId={currentFolderId} 
            activeDragId={activeDragId} 
          />

          {/* Root drop zone when inside a folder (only shows when NOT dragging to avoid duplication) */}
          {currentFolderId && !activeDragId && <div className="mb-4"><RootDropZone /></div>}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (documents.length === 0 && folders.length === 0) || (currentFolderId && documents.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">
                {currentFolderId ? 'This folder is empty' : 'No documents uploaded yet'}
              </p>
              <p className="text-sm mt-1">
                {currentFolderId 
                  ? 'Drag documents here or drop files from your desktop' 
                  : 'Drop files here or click Add to upload'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Show folders only at root level */}
              {!currentFolderId && folders.map((folder) => (
                <DroppableFolder
                  key={folder.id}
                  folder={folder}
                  documentCount={folderDocumentCounts[folder.id] || 0}
                  onClick={() => setCurrentFolderId(folder.id)}
                  onDelete={() => setDeleteFolderDialog(folder)}
                  onRename={() => {
                    setRenameFolderDialog(folder);
                    setNewFolderName(folder.name);
                  }}
                />
              ))}
              
              {/* Documents */}
              {documents.map((doc) => (
                <DraggableDocumentCard
                  key={doc.id}
                  doc={doc}
                  onSelect={() => setSelectedDocument(doc)}
                  onDownload={(e) => handleDownload(doc, e)}
                  getCategoryLabel={getCategoryLabel}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragDocument && (
          <div className="opacity-80 rotate-3 scale-105">
            <DraggableDocumentCard
              doc={activeDragDocument}
              onSelect={() => {}}
              onDownload={() => {}}
              getCategoryLabel={getCategoryLabel}
            />
          </div>
        )}
      </DragOverlay>

      {/* Modals */}
      <DocumentUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        projectId={projectId}
        onUploadComplete={fetchDocuments}
        defaultFolderId={currentFolderId}
      />

      <CreateFolderModal
        open={folderModalOpen}
        onOpenChange={setFolderModalOpen}
        projectId={projectId}
        onFolderCreated={() => {
          fetchFolders();
          fetchDocuments();
        }}
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

      {/* Delete Folder Confirmation */}
      <AlertDialog open={!!deleteFolderDialog} onOpenChange={() => setDeleteFolderDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFolderDialog?.name}"? 
              Documents inside will be moved back to the root level.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Folder Dialog */}
      <AlertDialog open={!!renameFolderDialog} onOpenChange={() => setRenameFolderDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for this folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="mt-2"
            onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRenameFolder} disabled={!newFolderName.trim()}>
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
