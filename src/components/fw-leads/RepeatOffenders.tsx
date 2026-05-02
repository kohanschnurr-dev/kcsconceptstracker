import { useMemo, useState } from 'react';
import { Download, PlusCircle, AlertTriangle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { FWLead } from './FWLeadsTable';

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
};

type OffenderRow = {
  address: string;
  count: number;
  mostRecentDate: string | null;
  types: string[];
  ids: string[];
  allInPipeline: boolean;
};

interface RepeatOffendersProps {
  leads: FWLead[];
  onRefresh: () => void;
}

export function RepeatOffenders({ leads, onRefresh }: RepeatOffendersProps) {
  const { toast } = useToast();
  const [addingId, setAddingId] = useState<string | null>(null);

  const offenders = useMemo<OffenderRow[]>(() => {
    // Filter to substandard building violations only
    const substandard = leads.filter(
      l => !l.skipped && l.type?.toLowerCase().includes('substandard')
    );

    // Group by address
    const grouped = new Map<string, FWLead[]>();
    for (const lead of substandard) {
      const key = lead.address.trim().toUpperCase();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(lead);
    }

    // Build rows for addresses with 2+ violations
    const rows: OffenderRow[] = [];
    for (const [, group] of grouped) {
      if (group.length < 2) continue;
      const sorted = [...group].sort((a, b) => {
        if (!a.open_date) return 1;
        if (!b.open_date) return -1;
        return new Date(b.open_date).getTime() - new Date(a.open_date).getTime();
      });
      const types = [...new Set(group.map(l => l.type).filter(Boolean))] as string[];
      rows.push({
        address: sorted[0].address,
        count: group.length,
        mostRecentDate: sorted[0].open_date,
        types,
        ids: group.map(l => l.id),
        allInPipeline: group.every(l => l.pipeline),
      });
    }

    // Sort by count descending
    return rows.sort((a, b) => b.count - a.count);
  }, [leads]);

  const handleAddToPipeline = async (row: OffenderRow) => {
    setAddingId(row.address);
    try {
      const { error } = await (supabase.from('fw_code_leads' as any) as any)
        .update({ pipeline: true })
        .in('id', row.ids);
      if (error) throw error;
      toast({ title: 'Added to pipeline', description: `${row.address} — ${row.count} violations` });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally {
      setAddingId(null);
    }
  };

  const handleExportCSV = () => {
    const header = 'Rank,Address,Violation Count,Most Recent Date,Types';
    const rows = offenders.map((r, i) =>
      [i + 1, `"${r.address}"`, r.count, r.mostRecentDate ?? '', `"${r.types.join(', ')}"`].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fw-repeat-offenders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold font-mono text-foreground">
            Repeat Offenders
            <span className="ml-2 text-xs text-muted-foreground font-normal">(Substandard Building · 2+ violations)</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{offenders.length} addresses identified</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
          onClick={handleExportCSV}
          disabled={offenders.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {offenders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-dashed border-border">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No repeat offenders found</p>
          <p className="text-xs text-muted-foreground mt-1">
            No addresses have 2+ Substandard Building violations on record.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-mono text-xs text-muted-foreground w-12">#</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">ADDRESS</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground w-28 text-center">VIOLATIONS</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground w-28">MOST RECENT</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">TYPES</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground w-32 text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offenders.map((row, i) => {
                const isHigh = row.count >= 3;
                return (
                  <TableRow
                    key={row.address}
                    className={cn(
                      'text-xs font-mono',
                      isHigh && 'bg-amber-500/5'
                    )}
                  >
                    <TableCell className="py-2.5 text-muted-foreground">
                      <span className={cn('font-bold', isHigh ? 'text-amber-400' : 'text-muted-foreground')}>
                        {i + 1}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {isHigh && <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        {row.address}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <Badge
                        variant={isHigh ? 'default' : 'outline'}
                        className={cn(
                          'text-xs font-mono min-w-8 justify-center',
                          isHigh
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/20'
                            : 'border-border text-muted-foreground'
                        )}
                      >
                        {row.count}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-muted-foreground">
                      {fmtDate(row.mostRecentDate)}
                    </TableCell>
                    <TableCell className="py-2.5 text-muted-foreground max-w-xs truncate">
                      {row.types.join(', ')}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Button
                        size="sm"
                        variant={row.allInPipeline ? 'outline' : 'default'}
                        className={cn(
                          'h-6 text-xs gap-1',
                          row.allInPipeline && 'text-muted-foreground border-border'
                        )}
                        disabled={row.allInPipeline || addingId === row.address}
                        onClick={() => handleAddToPipeline(row)}
                      >
                        <PlusCircle className="h-3 w-3" />
                        {row.allInPipeline ? 'In Pipeline' : 'Pipeline'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
