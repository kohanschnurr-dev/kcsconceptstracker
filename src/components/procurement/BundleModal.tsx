import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (bundle) {
        setName(bundle.name);
        setDescription(bundle.description || '');
        setProjectId(bundle.project_id || '');
      } else {
        setName('');
        setDescription('');
        setProjectId('');
      }
    }
  }, [bundle, open]);

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
      <DialogContent>
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : bundle ? 'Update Bundle' : 'Create Bundle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
