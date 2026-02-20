import { useState, useRef } from 'react';
import { Plus, CalendarIcon, Camera, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickTaskInputProps {
  onTaskCreated?: () => void;
}

export function QuickTaskInput({ onTaskCreated }: QuickTaskInputProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('task-photos')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
          continue;
        }

        const { data } = supabase.storage.from('task-photos').getPublicUrl(fileName);
        setPhotoUrls(prev => [...prev, data.publicUrl]);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (url: string) => {
    setPhotoUrls(prev => prev.filter(u => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          status: 'pending',
          priority_level: 'medium',
          due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
          photo_urls: photoUrls.length > 0 ? photoUrls : [],
        });

      if (error) throw error;

      setTitle('');
      setDueDate(undefined);
      setPhotoUrls([]);
      toast({
        title: 'Task added',
        description: 'Your task has been added to the checklist.',
      });
      onTaskCreated?.();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Quick add task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="pl-9"
            disabled={isSubmitting}
          />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Camera button */}
        <Button
          type="button"
          variant="outline"
          size="default"
          className={cn(
            "shrink-0 gap-1 min-w-[44px] px-2 sm:px-4",
            photoUrls.length > 0 && "text-primary"
          )}
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {photoUrls.length > 0 && <span className="text-xs">{photoUrls.length}</span>}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="default"
              className={cn(
                "shrink-0 gap-1 min-w-[44px] px-2 sm:px-4",
                dueDate && "text-primary"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {dueDate && <span className="text-xs">{format(dueDate, 'MMM d')}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
            {dueDate && (
              <div className="px-3 pb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setDueDate(undefined)}
                >
                  <X className="h-3 w-3 mr-1" /> Clear date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <Button type="submit" disabled={!title.trim() || isSubmitting} size="default" className="min-w-[60px] px-3 sm:min-w-[80px] sm:px-5">
          Add
        </Button>
      </form>

      {/* Thumbnail preview strip */}
      {photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {photoUrls.map((url, index) => (
            <div
              key={index}
              className="relative group w-10 h-10 rounded-lg overflow-hidden border bg-muted"
            >
              <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
