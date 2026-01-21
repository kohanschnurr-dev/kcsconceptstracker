import { useState, useCallback, useEffect, RefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsePasteUploadOptions {
  bucketName: string;
  folderPath?: string;
  onUploadComplete?: (url: string) => void;
  elementRef?: RefObject<HTMLElement>;
}

export function usePasteUpload({
  bucketName,
  folderPath = '',
  onUploadComplete,
  elementRef,
}: UsePasteUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
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
        return null;
      }

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const url = data.publicUrl;
      setUploadedUrls(prev => [...prev, url]);
      onUploadComplete?.(url);
      toast.success('Image uploaded');
      
      return url;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [bucketName, folderPath, onUploadComplete]);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
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

  useEffect(() => {
    const element = elementRef?.current || document;
    
    element.addEventListener('paste', handlePaste as EventListener);
    return () => {
      element.removeEventListener('paste', handlePaste as EventListener);
    };
  }, [handlePaste, elementRef]);

  const removeUrl = useCallback((url: string) => {
    setUploadedUrls(prev => prev.filter(u => u !== url));
  }, []);

  const clearUrls = useCallback(() => {
    setUploadedUrls([]);
  }, []);

  return {
    isUploading,
    uploadedUrls,
    uploadFile,
    removeUrl,
    clearUrls,
    setUploadedUrls,
  };
}
