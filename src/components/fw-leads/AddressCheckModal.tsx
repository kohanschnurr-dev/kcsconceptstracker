import { useState } from 'react';
import { Search, Copy, Check, X, PlusCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Lead = {
  id: string;
  address: string;
  type: string | null;
  open_date: string | null;
  status: string | null;
  case_number: string | null;
  notes: string | null;
  pipeline: boolean | null;
};

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface AddressCheckModalProps {
  onAddToPipeline: (id: string) => Promise<void>;
}

export function AddressCheckBar({ onAddToPipeline }: AddressCheckModalProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('fw_code_leads' as any) as any)
        .select('id, address, type, open_date, status, case_number, notes, pipeline')
        .ilike('address', `%${q}%`)
        .order('open_date', { ascending: false });
      if (error) throw error;
      setResults(data ?? []);
      setOpen(true);
    } catch (err: any) {
      toast({ title: 'Search failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openCount = results?.filter(r => r.status?.toLowerCase().includes('open')).length ?? 0;

  const buildSummary = () => {
    if (!results || results.length === 0) return `No violations on file for "${query}" — clean address`;
    const lines = [
      `Address Check: ${query}`,
      `Total violations: ${results.length} (${openCount} open)`,
      '',
      ...results.map(r =>
        `• ${r.case_number ?? 'N/A'} | ${r.type ?? 'Unknown'} | ${fmtDate(r.open_date)} | ${r.status ?? '—'}`
      ),
    ];
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildSummary()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePipeline = async (id: string) => {
    await onAddToPipeline(id);
    setResults(prev => prev?.map(r => r.id === id ? { ...r, pipeline: true } : r) ?? prev);
  };

  return (
    <>
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 bg-card border-border font-mono text-sm"
            placeholder="Check address for violations…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="border-primary/40 text-primary hover:bg-primary/10"
        >
          {loading ? 'Checking…' : 'Check Address'}
        </Button>
      </div>

      {/* Results modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-base">
              <Search className="h-4 w-4 text-primary" />
              Address Check — <span className="text-primary">{query}</span>
            </DialogTitle>
          </DialogHeader>

          {results && results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Check className="h-10 w-10 text-green-500" />
              <p className="text-base font-semibold text-foreground">No violations on file</p>
              <p className="text-sm text-muted-foreground">Clean address — no records matched.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary bar */}
              <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border px-3 py-2">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium font-mono">
                    {results?.length} violation{results?.length !== 1 ? 's' : ''} found
                  </span>
                  {openCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {openCount} Open
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy Summary'}
                </Button>
              </div>

              {/* Violations list */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {results?.map(r => (
                  <div
                    key={r.id}
                    className={cn(
                      'rounded-lg border px-3 py-2.5 text-sm font-mono',
                      r.status?.toLowerCase().includes('open')
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-border bg-muted/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">#{r.case_number ?? 'N/A'}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0',
                              r.status?.toLowerCase().includes('open')
                                ? 'border-amber-500/50 text-amber-400'
                                : 'border-border text-muted-foreground'
                            )}
                          >
                            {r.status ?? 'Unknown'}
                          </Badge>
                        </div>
                        <p className="text-foreground font-medium">{r.type ?? 'Unknown Type'}</p>
                        <p className="text-xs text-muted-foreground">Opened: {fmtDate(r.open_date)}</p>
                        {r.notes && <p className="text-xs text-muted-foreground italic mt-1 truncate">{r.notes}</p>}
                      </div>
                      <Button
                        size="sm"
                        variant={r.pipeline ? 'outline' : 'default'}
                        className={cn(
                          'shrink-0 text-xs h-7',
                          r.pipeline && 'text-muted-foreground border-border'
                        )}
                        disabled={!!r.pipeline}
                        onClick={() => handlePipeline(r.id)}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        {r.pipeline ? 'In Pipeline' : 'Add to Pipeline'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-1" /> Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
