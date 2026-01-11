import { useState, useEffect } from 'react';
import { Plus, X, Image, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Photo {
  id: string;
  project_id: string;
  file_path: string;
  caption: string | null;
  category: string;
  created_at: string;
}

interface PhotoGalleryProps {
  projectId: string;
}

const PHOTO_CATEGORIES = [
  { value: 'before', label: 'Before' },
  { value: 'during', label: 'During' },
  { value: 'after', label: 'After' },
  { value: 'general', label: 'General' },
];

export function PhotoGallery({ projectId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [caption, setCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, [projectId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('project-photos')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Failed to upload photo');
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('project_photos')
      .insert({
        project_id: projectId,
        file_path: fileName,
        caption: caption || null,
        category: selectedCategory,
      });

    if (insertError) {
      toast.error('Failed to save photo');
      console.error(insertError);
    } else {
      toast.success('Photo uploaded');
      setCaption('');
      setSelectedCategory('general');
      setIsOpen(false);
      fetchPhotos();
    }
    setUploading(false);
  };

  const handleDelete = async (photo: Photo) => {
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
      setSelectedPhoto(null);
      fetchPhotos();
    }
  };

  const getPhotoUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('project-photos')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const filteredPhotos = filterCategory === 'all' 
    ? photos 
    : photos.filter(p => p.category === filterCategory);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Image className="h-5 w-5" />
          Photo Gallery ({photos.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {PHOTO_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Photo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHOTO_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Caption (optional)</Label>
                  <Input 
                    value={caption} 
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                  />
                </div>
                <div>
                  <Label>Photo</Label>
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredPhotos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No photos yet. Add some to document your project!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredPhotos.map(photo => (
              <div 
                key={photo.id} 
                className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-muted"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img 
                  src={getPhotoUrl(photo.file_path)} 
                  alt={photo.caption || 'Project photo'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 left-2">
                  <span className="text-xs px-2 py-1 rounded bg-background/80 text-foreground capitalize">
                    {photo.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photo Preview Modal */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl">
            {selectedPhoto && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span className="capitalize">{selectedPhoto.category} Photo</span>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(selectedPhoto)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </DialogTitle>
                </DialogHeader>
                <img 
                  src={getPhotoUrl(selectedPhoto.file_path)} 
                  alt={selectedPhoto.caption || 'Project photo'}
                  className="w-full rounded-lg"
                />
                {selectedPhoto.caption && (
                  <p className="text-muted-foreground">{selectedPhoto.caption}</p>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
