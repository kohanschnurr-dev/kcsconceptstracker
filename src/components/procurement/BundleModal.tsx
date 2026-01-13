import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, X, ImageIcon } from 'lucide-react';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
  cover_image_url?: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: Bundle | null;
  projects: Project[];
  onSave: () => void;
}

export function BundleModal({ open, onOpenChange, bundle, projects, onSave }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (bundle) {
        setName(bundle.name);
        setDescription(bundle.description || '');
        setProjectId(bundle.project_id || '');
        setCoverImageUrl(bundle.cover_image_url || null);
      } else {
        setName('');
        setDescription('');
        setProjectId('');
        setCoverImageUrl(null);
      }
    }
  }, [bundle, open]);

  const uploadFile = async (file: File) => {
    if (!user) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('bundle-covers')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Failed to upload image');
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('bundle-covers').getPublicUrl(fileName);
    setCoverImageUrl(data.publicUrl);
    setUploading(false);
    toast.success('Image uploaded');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

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
    
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please drop an image file');
      return;
    }
    await uploadFile(file);
  };

  const handleRemoveImage = () => {
    setCoverImageUrl(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Bundle name is required');
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      project_id: projectId || null,
      user_id: user?.id,
      cover_image_url: coverImageUrl,
    };

    let error;
    if (bundle) {
      const result = await supabase
        .from('procurement_bundles')
        .update(payload)
        .eq('id', bundle.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('procurement_bundles')
        .insert(payload);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast.error('Failed to save bundle');
      console.error(error);
    } else {
      toast.success(bundle ? 'Bundle updated' : 'Bundle created');
      onOpenChange(false);
      onSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{bundle ? 'Edit Bundle' : 'Create Bundle'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Bundle Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Master Bath Materials"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div>
            <Label>Cover Photo</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            {coverImageUrl ? (
              <div className="relative mt-2 rounded-lg overflow-hidden aspect-video">
                <img
                  src={coverImageUrl}
                  alt="Bundle cover"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full mt-2 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {uploading ? (
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Assign to Project</Label>
            <Select 
              value={projectId || '__unassigned__'} 
              onValueChange={(v) => setProjectId(v === '__unassigned__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || uploading}>
            {loading ? 'Saving...' : bundle ? 'Update Bundle' : 'Create Bundle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
