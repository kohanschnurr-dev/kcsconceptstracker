import { useRef, useState, useCallback } from 'react';
import { X, Image, Loader2, Clipboard } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PasteableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  bucketName: string;
  folderPath?: string;
  uploadedImages: string[];
  onImagesChange: (images: string[]) => void;
  label?: string;
}

export function PasteableTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  bucketName,
  folderPath = '',
  uploadedImages,
  onImagesChange,
  label,
}: PasteableTextareaProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${folderPath ? `${folderPath}/` : ''}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image');
        return;
      }

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      onImagesChange([...uploadedImages, data.publicUrl]);
      toast.success('Image added');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [bucketName, folderPath, uploadedImages, onImagesChange]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadFile(file);
        }
        break;
      }
    }
  }, [uploadFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await uploadFile(file);
      }
    }
  };

  const removeImage = (url: string) => {
    onImagesChange(uploadedImages.filter(u => u !== url));
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative rounded-md transition-colors",
          isDragging && "ring-2 ring-primary ring-offset-2"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholder}
          rows={rows}
          className={className}
        />
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Hint text */}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Clipboard className="h-3 w-3" />
        Tip: Paste images with Ctrl+V or drag & drop
      </p>

      {/* Uploaded images preview */}
      {uploadedImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {uploadedImages.map((url, index) => (
            <div
              key={index}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
