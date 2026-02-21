import { useRef, useState } from 'react';
import { Camera, Loader2, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface WorkItem {
  text: string;
  amount: number;
  photos: string[];
}

interface WorkItemLinesProps {
  items: WorkItem[];
  onChange: (items: WorkItem[]) => void;
  placeholder?: string;
  label: string;
  description?: string;
}

export function WorkItemLines({ items, onChange, placeholder, label, description }: WorkItemLinesProps) {
  const { toast } = useToast();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const updateItem = (index: number, patch: Partial<WorkItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, { text: '', amount: 0, photos: [] }]);
  };

  const removePhoto = (itemIndex: number, photoUrl: string) => {
    const next = [...items];
    next[itemIndex] = { ...next[itemIndex], photos: next[itemIndex].photos.filter((u) => u !== photoUrl) };
    onChange(next);
  };

  const handleFileSelect = async (itemIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingIndex(itemIndex);
    const newPhotos: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage.from('task-photos').upload(fileName, file);
        if (error) {
          toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
          continue;
        }

        const { data } = supabase.storage.from('task-photos').getPublicUrl(fileName);
        newPhotos.push(data.publicUrl);
      }

      if (newPhotos.length > 0) {
        const next = [...items];
        next[itemIndex] = { ...next[itemIndex], photos: [...next[itemIndex].photos, ...newPhotos] };
        onChange(next);
      }
    } finally {
      setUploadingIndex(null);
      const ref = fileInputRefs.current[itemIndex];
      if (ref) ref.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground -mt-0.5">{description}</p>}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex gap-1.5 items-center">
              <Input
                value={item.text}
                onChange={(e) => updateItem(index, { text: e.target.value })}
                placeholder={placeholder}
                className="text-sm flex-1"
              />

              <div className="relative shrink-0 w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={item.amount || ''}
                  onChange={(e) => updateItem(index, { amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="text-sm pl-5 text-right"
                  min={0}
                  step={0.01}
                />
              </div>

              {/* Hidden file input */}
              <input
                ref={(el) => { fileInputRefs.current[index] = el; }}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(index, e)}
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn('shrink-0 h-9 w-9', item.photos.length > 0 && 'text-primary')}
                disabled={uploadingIndex === index}
                onClick={() => fileInputRefs.current[index]?.click()}
              >
                {uploadingIndex === index ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Photo thumbnails */}
            {item.photos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-1">
                {item.photos.map((url, pi) => (
                  <div key={pi} className="relative group w-10 h-10 rounded-md overflow-hidden border bg-muted">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index, url)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {(() => {
        const total = items.reduce((sum, i) => sum + (i.amount || 0), 0);
        return total > 0 ? (
          <p className="text-sm font-medium text-right pr-1">
            Subtotal: ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ) : null;
      })()}

      <Button type="button" variant="outline" size="sm" className="gap-1 mt-1" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" />
        Add Item
      </Button>
    </div>
  );
}
