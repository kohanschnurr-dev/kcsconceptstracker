import { useState, useEffect, useCallback } from 'react';
import { Trash2, ChevronLeft, ChevronRight, Pencil, Check, X, Calendar, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface Photo {
  id: string;
  project_id: string;
  file_path: string;
  caption: string | null;
  category: string;
  created_at: string;
  photo_date: string | null;
}

interface PhotoPreviewModalProps {
  photo: Photo | null;
  onClose: () => void;
  onUpdate: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  getPhotoUrl: (filePath: string) => string;
}

const PHOTO_CATEGORIES = [
  { value: 'before', label: 'Before' },
  { value: 'during', label: 'During' },
  { value: 'after', label: 'After' },
  { value: 'general', label: 'General' },
];

export function PhotoPreviewModal({ 
  photo, 
  onClose, 
  onUpdate, 
  onNavigate,
  getPhotoUrl 
}: PhotoPreviewModalProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // Reset edit state when photo changes
  useEffect(() => {
    if (photo) {
      setEditCaption(photo.caption || '');
      setEditCategory(photo.category || 'general');
      setEditDate(photo.photo_date ? parseISO(photo.photo_date) : undefined);
      setIsEditingCaption(false);
    }
  }, [photo?.id]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!photo) return;
    if (e.key === 'ArrowLeft') {
      onNavigate('prev');
    } else if (e.key === 'ArrowRight') {
      onNavigate('next');
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [photo, onNavigate, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!photo) return null;

  const handleDelete = async () => {
    const { error: storageError } = await supabase.storage
      .from('project-photos')
      .remove([photo.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    const { error } = await supabase
      .from('project_photos')
      .delete()
      .eq('id', photo.id);

    if (error) {
      toast.error('Failed to delete photo');
    } else {
      toast.success('Photo deleted');
      onUpdate();
    }
  };

  const handleSaveCaption = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('project_photos')
      .update({ caption: editCaption || null })
      .eq('id', photo.id);

    if (error) {
      toast.error('Failed to update caption');
    } else {
      toast.success('Caption updated');
      setIsEditingCaption(false);
      onUpdate();
    }
    setIsSaving(false);
  };

  const handleCategoryChange = async (newCategory: string) => {
    setEditCategory(newCategory);
    const { error } = await supabase
      .from('project_photos')
      .update({ category: newCategory })
      .eq('id', photo.id);

    if (error) {
      toast.error('Failed to update category');
      setEditCategory(photo.category);
    } else {
      toast.success('Category updated');
    }
  };

  const handleDateChange = async (newDate: Date | undefined) => {
    if (!newDate) return;
    setEditDate(newDate);
    const { error } = await supabase
      .from('project_photos')
      .update({ photo_date: format(newDate, 'yyyy-MM-dd') })
      .eq('id', photo.id);

    if (error) {
      toast.error('Failed to update date');
      setEditDate(photo.photo_date ? parseISO(photo.photo_date) : undefined);
    } else {
      toast.success('Date updated');
    }
  };

  const handleDownload = () => {
    const url = getPhotoUrl(photo.file_path);
    const link = document.createElement('a');
    link.href = url;
    link.download = photo.file_path.split('/').pop() || 'photo';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={!!photo} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={editCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[110px] h-8">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {editDate ? format(editDate, 'MMM d, yyyy') : 'Set date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editDate}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 min-h-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 z-10 bg-background/50 hover:bg-background/80"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <img 
            src={getPhotoUrl(photo.file_path)} 
            alt={photo.caption || 'Project photo'}
            className="max-w-full max-h-[60vh] object-contain rounded-lg"
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 z-10 bg-background/50 hover:bg-background/80"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Caption Section */}
        <div className="flex-shrink-0 pt-3 border-t">
          {isEditingCaption ? (
            <div className="flex items-center gap-2">
              <Input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Add a caption..."
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCaption();
                  if (e.key === 'Escape') {
                    setEditCaption(photo.caption || '');
                    setIsEditingCaption(false);
                  }
                }}
              />
              <Button size="sm" onClick={handleSaveCaption} disabled={isSaving}>
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setEditCaption(photo.caption || '');
                  setIsEditingCaption(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer group p-2 -m-2 rounded hover:bg-muted/50"
              onClick={() => setIsEditingCaption(true)}
            >
              <p className={photo.caption ? "text-foreground" : "text-muted-foreground italic"}>
                {photo.caption || 'Click to add caption...'}
              </p>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Use ← → arrow keys to navigate
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
