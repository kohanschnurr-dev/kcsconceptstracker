import { useState, useCallback, useEffect } from 'react';
import { ShieldAlert, Map as MapIcon, List, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddressCheckBar } from '@/components/fw-leads/AddressCheckModal';
import { FWLeadsTable } from '@/components/fw-leads/FWLeadsTable';
import { RepeatOffenders } from '@/components/fw-leads/RepeatOffenders';
import { HeatmapView } from '@/components/fw-leads/HeatmapView';
import { cn } from '@/lib/utils';
import type { FWLead } from '@/components/fw-leads/FWLeadsTable';

type TabId = 'violations' | 'repeat';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'violations', label: 'FW Leads', icon: List },
  { id: 'repeat', label: 'Repeat Offenders', icon: Users },
];

export default function FWLeads() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('violations');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [leads, setLeads] = useState<FWLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      // Paginate through all records to handle large datasets
      const PAGE = 1000;
      let all: FWLead[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await (supabase.from('fw_code_leads' as any) as any)
          .select('id, address, type, open_date, status, case_number, notes, skipped, pipeline, checked')
          .order('open_date', { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all = [...all, ...data];
        if (data.length < PAGE) break;
        from += PAGE;
      }
      setLeads(all);
    } catch (err: any) {
      toast({ title: 'Failed to load leads', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleAddToPipeline = async (id: string) => {
    const { error } = await (supabase.from('fw_code_leads' as any) as any)
      .update({ pipeline: true })
      .eq('id', id);
    if (error) {
      toast({ title: 'Failed to update pipeline', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Added to pipeline' });
      fetchLeads();
    }
  };

  const openCount = leads.filter(l => !l.skipped && l.status?.toLowerCase().includes('open')).length;
  const pipelineCount = leads.filter(l => !l.skipped && l.pipeline).length;
  const substandardCount = leads.filter(l => !l.skipped && l.type?.toLowerCase().includes('substandard')).length;

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-amber-500" />
              FW Leads
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">
              Fort Worth Building Standards Commission violations
            </p>
          </div>

          {/* Stat chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-muted-foreground">
              {leads.filter(l => !l.skipped).length} total
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {openCount} open
            </span>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">
              {pipelineCount} in pipeline
            </span>
            <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
              {substandardCount} substandard
            </span>
          </div>
        </div>

        {/* Address check bar */}
        <AddressCheckBar onAddToPipeline={handleAddToPipeline} />

        {/* Heatmap view (replaces tabs) */}
        {showHeatmap ? (
          <HeatmapView leads={leads} onBack={() => setShowHeatmap(false)} />
        ) : (
          <>
            {/* Tab bar + heatmap toggle */}
            <div className="flex items-center justify-between border-b border-border">
              <div className="flex">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                      tab === t.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="mb-1 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                onClick={() => setShowHeatmap(true)}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Heatmap
              </Button>
            </div>

            {/* Tab content */}
            {tab === 'violations' && (
              <FWLeadsTable leads={leads} isLoading={isLoading} onRefresh={fetchLeads} />
            )}
            {tab === 'repeat' && (
              <RepeatOffenders leads={leads} onRefresh={fetchLeads} />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
