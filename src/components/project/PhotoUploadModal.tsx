import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, Image, Loader2, Check, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PendingFile {
  file: File;
  preview: string;
  caption: string;
}

interface PhotoUploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

const PHOTO_CATEGORIES = [
  { value: 'before', label: 'Before' },
  { value: 'during', label: 'During' },
  { value: 'after', label: 'After' },
  { value: 'general', label: 'General' },
];

export function PhotoUploadModal({ projectId, isOpen, onClose, onUploadComplete }: PhotoUploadModalProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [globalCategory, setGlobalCategory] = useState('general');
  const [globalCaption, setGlobalCaption] = useState('');
  const [photoDate, setPhotoDate] = useState<Date>(new Date());
  const [applyGlobalCaption, setApplyGlobalCaption] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
    };
  }, []);

  // Handle paste events
  useEffect(() => {
    if (!isOpen) return;
    
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen, pendingFiles]);

  const addFiles = useCallback((files: File[]) => {
    const newPendingFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
    }));
    setPendingFiles(prev => [...prev, ...newPendingFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateFileCaption = (index: number, caption: string) => {
    setPendingFiles(prev => prev.map((pf, i) => 
      i === index ? { ...pf, caption } : pf
    ));
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress({ current: 0, total: pendingFiles.length });
    setUploadedFiles([]);

    for (let i = 0; i < pendingFiles.length; i++) {
      const pf = pendingFiles[i];
      setUploadProgress({ current: i, total: pendingFiles.length });

      const fileExt = pf.file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, pf.file);

      if (uploadError) {
        toast.error(`Failed to upload ${pf.file.name}`);
        console.error(uploadError);
        continue;
      }

      const caption = applyGlobalCaption ? globalCaption : pf.caption;
      
      const { error: insertError } = await supabase
        .from('project_photos')
        .insert({
          project_id: projectId,
          file_path: fileName,
          caption: caption || null,
          category: globalCategory,
          photo_date: format(photoDate, 'yyyy-MM-dd'),
        });

      if (insertError) {
        toast.error(`Failed to save ${pf.file.name}`);
        console.error(insertError);
      } else {
        setUploadedFiles(prev => [...prev, pf.file.name]);
      }
    }

    setUploadProgress({ current: pendingFiles.length, total: pendingFiles.length });
    
    toast.success(`Uploaded ${pendingFiles.length} photo${pendingFiles.length > 1 ? 's' : ''}`);
    
    // Cleanup and close
    pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
    setPendingFiles([]);
    setGlobalCaption('');
    setGlobalCategory('general');
    setPhotoDate(new Date());
    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    setUploadedFiles([]);
    onUploadComplete();
    onClose();
  };

  const handleClose = () => {
    if (isUploading) return;
    pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
    setPendingFiles([]);
    setGlobalCaption('');
    setGlobalCategory('general');
    setPhotoDate(new Date());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
        </DialogHeader>

        {isUploading ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                Uploading {uploadProgress.total} photo{uploadProgress.total > 1 ? 's' : ''}...
              </p>
              <Progress 
                value={(uploadProgress.current / uploadProgress.total) * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {uploadProgress.current} of {uploadProgress.total}
              </p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingFiles.map((pf, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {uploadedFiles.includes(pf.file.name) ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : index === uploadProgress.current ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className={cn(
                    uploadedFiles.includes(pf.file.name) && "text-muted-foreground"
                  )}>
                    {pf.file.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              ref={dropZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Drop photos here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Ctrl+V to paste from clipboard</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && (
              <div className="space-y-3">
                <Label>Selected ({pendingFiles.length} photo{pendingFiles.length > 1 ? 's' : ''})</Label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {pendingFiles.map((pf, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={pf.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Fields */}
            {pendingFiles.length > 0 && (
              <div className="space-y-4 pt-2 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={globalCategory} onValueChange={setGlobalCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHOTO_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Photo Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(photoDate, 'MMM d, yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={photoDate}
                          onSelect={(date) => date && setPhotoDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Caption</Label>
                    {pendingFiles.length > 1 && (
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={applyGlobalCaption}
                          onCheckedChange={(checked) => setApplyGlobalCaption(checked === true)}
                        />
                        Apply to all photos
                      </label>
                    )}
                  </div>
                  {applyGlobalCaption ? (
                    <Input
                      value={globalCaption}
                      onChange={(e) => setGlobalCaption(e.target.value)}
                      placeholder="Add a caption..."
                    />
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {pendingFiles.map((pf, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <img 
                            src={pf.preview} 
                            alt="" 
                            className="h-8 w-8 rounded object-cover flex-shrink-0" 
                          />
                          <Input
                            value={pf.caption}
                            onChange={(e) => updateFileCaption(index, e.target.value)}
                            placeholder={`Caption for photo ${index + 1}...`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={pendingFiles.length === 0}
              >
                <Image className="h-4 w-4 mr-2" />
                Upload {pendingFiles.length > 0 ? `${pendingFiles.length} Photo${pendingFiles.length > 1 ? 's' : ''}` : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
