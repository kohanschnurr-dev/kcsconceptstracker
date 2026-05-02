import { useState, useEffect, useCallback } from 'react';
import { Trash2, Check, PlusCircle, MinusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export type FWLead = {
  id: string;
  address: string;
  type: string | null;
  open_date: string | null;
  status: string | null;
  case_number: string | null;
  notes: string | null;
  skipped: boolean | null;
  pipeline: boolean | null;
  checked: boolean | null;
};

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
};

const PER_PAGE = 50;

interface FWLeadsTableProps {
  leads: FWLead[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function FWLeadsTable({ leads, isLoading, onRefresh }: FWLeadsTableProps) {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');

  const filtered = leads.filter(l => {
    if (l.skipped) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    if (pipelineFilter === 'pipeline' && !l.pipeline) return false;
    if (pipelineFilter === 'checked' && !l.checked) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const uniqueStatuses = [...new Set(leads.map(l => l.status).filter(Boolean))] as string[];
  const uniqueTypes = [...new Set(leads.map(l => l.type).filter(Boolean))] as string[];

  const mutate = useCallback(async (id: string, updates: Partial<FWLead>) => {
    const { error } = await (supabase.from('fw_code_leads' as any) as any).update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      onRefresh();
    }
  }, [onRefresh, toast]);

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from('fw_code_leads' as any) as any).update({ skipped: true }).eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Record hidden' });
      onRefresh();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm font-mono">
        Loading violations…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="h-8 w-40 text-xs bg-card border-border">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="h-8 w-52 text-xs bg-card border-border">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={pipelineFilter} onValueChange={v => { setPipelineFilter(v); setPage(0); }}>
          <SelectTrigger className="h-8 w-36 text-xs bg-card border-border">
            <SelectValue placeholder="All Records" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Records</SelectItem>
            <SelectItem value="pipeline">In Pipeline</SelectItem>
            <SelectItem value="checked">Checked</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-mono text-xs text-muted-foreground w-56">ADDRESS</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">TYPE</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground w-24">OPEN DATE</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground w-24">STATUS</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground w-28">CASE #</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">NOTES</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground w-28 text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-sm text-muted-foreground font-mono">
                  No violations match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              paged.map(lead => (
                <TableRow
                  key={lead.id}
                  className={cn(
                    'text-xs font-mono transition-colors',
                    lead.pipeline && 'bg-primary/5',
                    lead.checked && 'opacity-50'
                  )}
                >
                  <TableCell className="py-2 font-medium text-foreground">{lead.address}</TableCell>
                  <TableCell className="py-2">
                    <span className={cn(
                      'text-xs',
                      lead.type?.toLowerCase().includes('substandard') ? 'text-amber-400' : 'text-muted-foreground'
                    )}>
                      {lead.type ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 text-muted-foreground">{fmtDate(lead.open_date)}</TableCell>
                  <TableCell className="py-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5',
                        lead.status?.toLowerCase().includes('open')
                          ? 'border-amber-500/50 text-amber-400'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      {lead.status ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 text-muted-foreground">{lead.case_number ?? '—'}</TableCell>
                  <TableCell className="py-2 text-muted-foreground max-w-xs truncate">{lead.notes ?? '—'}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn('h-6 w-6', lead.pipeline ? 'text-primary' : 'text-muted-foreground hover:text-primary')}
                        title={lead.pipeline ? 'Remove from Pipeline' : 'Add to Pipeline'}
                        onClick={() => mutate(lead.id, { pipeline: !lead.pipeline })}
                      >
                        {lead.pipeline ? <MinusCircle className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn('h-6 w-6', lead.checked ? 'text-green-500' : 'text-muted-foreground hover:text-green-500')}
                        title="Mark Checked"
                        onClick={() => mutate(lead.id, { checked: !lead.checked })}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        title="Hide Record"
                        onClick={() => handleDelete(lead.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
