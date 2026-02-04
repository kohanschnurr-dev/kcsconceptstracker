import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onFolderCreated: () => void;
}

export function CreateFolderModal({
  open,
  onOpenChange,
  projectId,
  onFolderCreated,
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('document_folders')
      .insert({
        project_id: projectId,
        name: name.trim(),
      });

    if (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    } else {
      toast.success('Folder created');
      setName('');
      onOpenChange(false);
      onFolderCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-amber-500" />
            Create Folder
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="e.g., Permits, Contracts..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
