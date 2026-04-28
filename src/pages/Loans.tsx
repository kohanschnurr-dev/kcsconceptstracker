import { useState, useMemo, useCallback } from 'react';
import { Landmark, Plus, GitCompareArrows } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { LoanStatsRow } from '@/components/loans/LoanStatsRow';
import { LoanTable } from '@/components/loans/LoanTable';
import { LoanCharts } from '@/components/loans/LoanCharts';
import { LoanComparePanel } from '@/components/loans/LoanComparePanel';
import { AddLoanModal } from '@/components/loans/AddLoanModal';
import { useLoans } from '@/hooks/useLoans';
import type { Loan, LoanDraw } from '@/types/loans';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ProjectType = 'fix_flip' | 'rental' | 'new_construction';

const PROJECT_TYPE_PILLS: { value: ProjectType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Projects' },
  { value: 'fix_flip', label: 'Fix & Flips' },
  { value: 'rental', label: 'Rentals' },
  { value: 'new_construction', label: 'New Construction' },
];

export default function Loans() {
  const { loans, isLoading, createLoan } = useLoans();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [projectTypeFilter, setProjectTypeFilter] = useState<ProjectType | 'all'>('all');

  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  }, []);

  const compareLoans = useMemo(() => compareIds.map(id => loans.find(l => l.id === id)).filter(Boolean) as typeof loans, [compareIds, loans]);

  const projectNames = useMemo(
    () => [...new Set(loans.map(l => l.project_name).filter(Boolean) as string[])].sort(),
    [loans],
  );

  // Look up project_type for each project name referenced by loans, so we can
  // filter the entire page (stats, charts, table) by Fix & Flip / Rental / New Construction.
  const { data: projectTypesRows = [] } = useQuery<{ name: string; project_type: string | null }[]>({
    queryKey: ['project_types_for_loans_page', projectNames],
    enabled: projectNames.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('name, project_type')
        .in('name', projectNames);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });
  const projectTypeByName = useMemo(() => {
    const m = new Map<string, ProjectType>();
    for (const r of projectTypesRows) {
      if (r.name && r.project_type) m.set(r.name, r.project_type as ProjectType);
    }
    return m;
  }, [projectTypesRows]);

  const visibleLoans = useMemo(() => {
    if (projectTypeFilter === 'all') return loans;
    return loans.filter(l => {
      const pn = l.project_name;
      return !!pn && projectTypeByName.get(pn) === projectTypeFilter;
    });
  }, [loans, projectTypeFilter, projectTypeByName]);

  const handleAddLoan = async (
    payload: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'project_name'>,
    draws: Omit<LoanDraw, 'id' | 'created_at' | 'loan_id'>[],
  ) => {
    const loanData = await createLoan.mutateAsync(payload);
    if (draws.length > 0 && loanData?.id) {
      const drawRows = draws.map(d => ({ ...d, loan_id: loanData.id }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('loan_draws' as any) as any).insert(drawRows);
      if (error) toast({ title: 'Draws saved with errors', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Landmark className="h-6 w-6 text-primary" />
              Loans
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track debt across your entire portfolio</p>
          </div>
          <div className="flex items-center gap-2">
            {loans.length >= 2 && (
              <Button
                variant={compareMode ? 'default' : 'outline'}
                onClick={() => { setCompareMode(m => !m); setCompareIds([]); }}
              >
                <GitCompareArrows className="h-4 w-4 mr-1.5" />
                {compareMode ? 'Exit Compare' : 'Compare'}
              </Button>
            )}
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Loan
            </Button>
          </div>
        </div>

        {/* Page-wide project-type filter — drives stats, table, and charts */}
        {loans.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {PROJECT_TYPE_PILLS.map(pill => {
              const active = projectTypeFilter === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setProjectTypeFilter(pill.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                    active
                      ? 'bg-primary/15 text-primary border-primary/40'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground',
                  )}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <LoanStatsRow loans={visibleLoans} />

        {/* Empty state */}
        {!isLoading && loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <div className="rounded-full bg-primary/10 p-5 mb-4">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No loans yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Add your first loan to start tracking debt, draw schedules, and amortization across your portfolio.
            </p>
            <Button className="mt-5" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Your First Loan
            </Button>
          </div>
        ) : (
          <>
            {/* Compare panel */}
            {compareMode && compareLoans.length >= 2 && (
              <LoanComparePanel
                loans={compareLoans}
                onClose={() => { setCompareMode(false); setCompareIds([]); }}
              />
            )}

            {compareMode && compareLoans.length < 2 && (
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-center text-sm text-muted-foreground">
                Select 2–3 loans from the table below to compare
              </div>
            )}

            {/* Loans table */}
            <LoanTable
              loans={visibleLoans}
              projectNames={projectNames}
              compareMode={compareMode}
              selectedIds={compareIds}
              onToggleSelect={toggleCompare}
            />

            {/* Charts */}
            <LoanCharts loans={visibleLoans} />
          </>
        )}
      </div>

      <AddLoanModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddLoan}
      />
    </MainLayout>
  );
}
