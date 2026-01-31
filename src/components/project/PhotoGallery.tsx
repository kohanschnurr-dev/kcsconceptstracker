import { useState, useEffect } from 'react';
import { Plus, Image, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { PhotoUploadModal } from './PhotoUploadModal';
import { PhotoPreviewModal } from './PhotoPreviewModal';

interface Photo {
  id: string;
  project_id: string;
  file_path: string;
  caption: string | null;
  category: string;
  created_at: string;
  photo_date: string | null;
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

const DATE_FILTERS = [
  { value: 'all', label: 'All Dates' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
];

export function PhotoGallery({ projectId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('photo_date', { ascending: false, nullsFirst: false });

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

  const getPhotoUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('project-photos')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getFilteredPhotos = () => {
    let filtered = photos;

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    // Date filter
    if (filterDate !== 'all') {
      const now = new Date();
      let daysAgo = 7;
      if (filterDate === '30days') daysAgo = 30;
      if (filterDate === '90days') daysAgo = 90;
      
      const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
      filtered = filtered.filter(p => {
        const photoDate = p.photo_date ? new Date(p.photo_date) : new Date(p.created_at);
        return photoDate >= cutoffDate;
      });
    }

    return filtered;
  };

  const filteredPhotos = getFilteredPhotos();

  const handlePhotoUpdate = () => {
    fetchPhotos();
    setSelectedPhoto(null);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length
      : (currentIndex + 1) % filteredPhotos.length;
    
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Image className="h-5 w-5" />
          Photo Gallery ({photos.length})
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {PHOTO_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTERS.map(df => (
                <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setIsUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Photos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredPhotos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {photos.length === 0 
              ? "No photos yet. Add some to document your project!"
              : "No photos match the current filters."
            }
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded bg-background/80 text-foreground capitalize">
                    {photo.category}
                  </span>
                  {photo.photo_date && (
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/80 text-primary-foreground">
                      {new Date(photo.photo_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <PhotoUploadModal
        projectId={projectId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={fetchPhotos}
      />

      <PhotoPreviewModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onUpdate={handlePhotoUpdate}
        onNavigate={navigatePhoto}
        getPhotoUrl={getPhotoUrl}
      />
    </Card>
  );
}
