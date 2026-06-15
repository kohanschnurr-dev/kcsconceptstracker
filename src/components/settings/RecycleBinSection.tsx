import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw, Loader2, ImageOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type BinProject = {
  id: string;
  name: string;
  address: string | null;
  project_type: string | null;
  deleted_at: string;
  photo_url?: string | null;
};

const typeLabel = (t: string | null) =>
  t === 'new_construction' ? 'New Construction'
  : t === 'fix_flip' ? 'Fix & Flip'
  : t === 'rental' ? 'Rental'
  : 'Project';

export default function RecycleBinSection() {
  const [items, setItems] = useState<BinProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BinProject | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [emptyText, setEmptyText] = useState('');
  const [emptying, setEmptying] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, address, project_type, deleted_at, photo_url')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (error) {
      toast.error('Failed to load Recycle Bin');
    } else {
      setItems((data ?? []) as BinProject[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const restore = async (p: BinProject) => {
    setBusyId(p.id);
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: null } as any)
      .eq('id', p.id);
    setBusyId(null);
    if (error) return toast.error('Failed to restore');
    toast.success(`${p.name} restored`);
    setItems(items.filter(i => i.id !== p.id));
  };

  const purgeOne = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    // Reset QB expenses back to pending queue
    await supabase
      .from('quickbooks_expenses')
      .update({ project_id: null, category_id: null, is_imported: false, cost_type: 'construction' })
      .eq('project_id', confirmDelete.id);
    const { error } = await supabase.from('projects').delete().eq('id', confirmDelete.id);
    setBusyId(null);
    if (error) return toast.error('Failed to delete');
    toast.success(`${confirmDelete.name} permanently deleted`);
    setItems(items.filter(i => i.id !== confirmDelete.id));
    setConfirmDelete(null);
    setConfirmName('');
  };

  const emptyBin = async () => {
    setEmptying(true);
    const ids = items.map(i => i.id);
    await supabase
      .from('quickbooks_expenses')
      .update({ project_id: null, category_id: null, is_imported: false, cost_type: 'construction' })
      .in('project_id', ids);
    const { error } = await supabase.from('projects').delete().in('id', ids);
    setEmptying(false);
    if (error) return toast.error('Failed to empty bin');
    toast.success('Recycle Bin emptied');
    setItems([]);
    setEmptyOpen(false);
    setEmptyText('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Recycle Bin
              {items.length > 0 && (
                <Badge variant="secondary" className="ml-1">{items.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {items.length === 0
                ? 'Deleted projects appear here. Restore them or delete them forever.'
                : `${items.length} project${items.length === 1 ? '' : 's'} waiting. Restore or permanently delete.`}
            </CardDescription>
          </div>
          <Button
            variant="destructive"
            size="sm"
            disabled={items.length === 0 || emptying}
            onClick={() => setEmptyOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Empty Bin
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Trash2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">The bin is empty.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border">
            {items.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-3 bg-card">
                <div className="h-14 w-14 shrink-0 border border-border bg-muted overflow-hidden flex items-center justify-center">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-5 w-5 text-muted-foreground/50" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{p.name}</p>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      {typeLabel(p.project_type)}
                    </Badge>
                  </div>
                  {p.address && (
                    <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Deleted {formatDistanceToNow(new Date(p.deleted_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === p.id}
                    onClick={() => restore(p)}
                  >
                    {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1.5" />}
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={busyId === p.id}
                    onClick={() => { setConfirmDelete(p); setConfirmName(''); }}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete Forever
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Permanently delete single */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) { setConfirmDelete(null); setConfirmName(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently delete this project?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  All data for <strong>{confirmDelete?.name}</strong> (expenses, tasks, documents, photos, logs) will be permanently destroyed.
                  Categorized QuickBooks expenses will return to the pending queue. This cannot be undone.
                </p>
                <p>Type <strong>{confirmDelete?.name}</strong> to confirm.</p>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Type project name..."
                  autoFocus
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={confirmName !== confirmDelete?.name || busyId === confirmDelete?.id}
              onClick={(e) => { e.preventDefault(); purgeOne(); }}
            >
              {busyId === confirmDelete?.id ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Deleting...</> : 'Delete Forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty bin */}
      <AlertDialog open={emptyOpen} onOpenChange={(o) => { if (!o) { setEmptyOpen(false); setEmptyText(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Empty Recycle Bin?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will permanently delete <strong>{items.length}</strong> project{items.length === 1 ? '' : 's'} and all related data. This cannot be undone.
                </p>
                <p>Type <strong>DELETE</strong> to confirm.</p>
                <Input
                  value={emptyText}
                  onChange={(e) => setEmptyText(e.target.value)}
                  placeholder="DELETE"
                  autoFocus
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={emptyText !== 'DELETE' || emptying}
              onClick={(e) => { e.preventDefault(); emptyBin(); }}
            >
              {emptying ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Emptying...</> : 'Empty Bin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
