import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
import { useCostHistory, CategoryStat } from '@/hooks/useCostHistory';
import { getBudgetCategories } from '@/types';
import { cn } from '@/lib/utils';
import { Search, ChevronRight, History, ArrowDownToLine, Layers } from 'lucide-react';

const SEARCH_KEY = 'cost-history-search';
const PROJECT_KEY = 'cost-history-project';
const STATUS_KEY = 'cost-history-status';

type StatusFilter = 'all' | 'active' | 'complete';

interface CostHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseAmount?: (category: string, amount: number) => void;
}

const currency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

export function CostHistoryPanel({ open, onOpenChange, onUseAmount }: CostHistoryPanelProps) {
  const { loading, projects, stats } = useCostHistory(open);

  const [search, setSearch] = useState(() => localStorage.getItem(SEARCH_KEY) || '');
  const [projectId, setProjectId] = useState(() => localStorage.getItem(PROJECT_KEY) || '');
  const [status, setStatus] = useState<StatusFilter>(
    () => (localStorage.getItem(STATUS_KEY) as StatusFilter) || 'all',
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(SEARCH_KEY, search); }, [search]);
  useEffect(() => { localStorage.setItem(PROJECT_KEY, projectId); }, [projectId]);
  useEffect(() => { localStorage.setItem(STATUS_KEY, status); }, [status]);

  const labelFor = useMemo(() => {
    const map = new Map(getBudgetCategories().map((c: any) => [c.value, c.label]));
    return (value: string) => map.get(value) || value.replace(/_/g, ' ');
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stats
      .map((s: CategoryStat) => {
        const projectsFiltered = s.projects.filter((p) => {
          if (projectId && p.projectId !== projectId) return false;
          if (status === 'active' && p.status !== 'active') return false;
          if (status === 'complete' && p.status !== 'complete') return false;
          return true;
        });
        const actual = projectsFiltered.reduce((sum, p) => sum + p.actual, 0);
        const budgeted = projectsFiltered.reduce((sum, p) => sum + p.budgeted, 0);
        return { ...s, projects: projectsFiltered, actual, budgeted };
      })
      .filter((s) => s.projects.length > 0 && (s.actual > 0 || s.budgeted > 0))
      .filter((s) => !q || labelFor(s.category).toLowerCase().includes(q) || s.category.includes(q))
      .sort((a, b) => b.actual - a.actual);
  }, [stats, search, projectId, status, labelFor]);

  const totals = useMemo(() => {
    const actual = rows.reduce((sum, r) => sum + r.actual, 0);
    const budgeted = rows.reduce((sum, r) => sum + r.budgeted, 0);
    const projectIds = new Set<string>();
    rows.forEach((r) => r.projects.forEach((p) => projectIds.add(p.projectId)));
    return { actual, budgeted, variance: actual - budgeted, projectCount: projectIds.size };
  }, [rows]);

  const selectedProjectName = projects.find((p) => p.id === projectId)?.name;

  const statusChips: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'complete', label: 'Completed' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col gap-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Cost History
          </SheetTitle>
          <SheetDescription className="text-xs">
            What each category has actually cost across your projects.
          </SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <div className="px-5 py-3 space-y-2.5 border-b border-border bg-muted/20">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search a category (roofing, cabinets...)"
              className="pl-8 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {projectId ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 truncate text-sm border border-border rounded-md h-9 px-3 flex items-center bg-background">
                    <Layers className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                    <span className="truncate">{selectedProjectName || 'Project'}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setProjectId('')} className="h-9">
                    All
                  </Button>
                </div>
              ) : (
                <ProjectAutocomplete
                  projects={projects}
                  value={projectId}
                  onSelect={setProjectId}
                  placeholder="All Projects"
                  triggerClassName="h-9"
                />
              )}
            </div>
            <div className="flex items-center gap-1">
              {statusChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => setStatus(chip.key)}
                  className={cn(
                    'h-9 px-2.5 text-xs rounded-md border transition-colors',
                    status === chip.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-4 border-b border-border">
          {[
            { label: 'Actual', value: currency(totals.actual) },
            { label: 'Budgeted', value: currency(totals.budgeted) },
            {
              label: totals.variance >= 0 ? 'Over' : 'Under',
              value: currency(Math.abs(totals.variance)),
              tone: totals.variance > 0 ? 'text-destructive' : 'text-primary',
            },
            { label: 'Projects', value: String(totals.projectCount) },
          ].map((tile) => (
            <div key={tile.label} className="px-3 py-2.5 border-r border-border last:border-r-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{tile.label}</div>
              <div className={cn('text-sm font-semibold font-mono truncate', (tile as any).tone)}>
                {tile.value}
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-5 py-3 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}

            {!loading && rows.length === 0 && (
              <div className="px-5 py-16 text-center text-sm text-muted-foreground">
                {search.trim()
                  ? `No spend recorded for "${search.trim()}" yet.`
                  : 'No cost history recorded yet.'}
              </div>
            )}

            {!loading &&
              rows.map((row) => {
                const isOpen = expanded === row.category;
                const max = Math.max(row.actual, row.budgeted, 1);
                const variancePct = row.budgeted > 0 ? ((row.actual - row.budgeted) / row.budgeted) * 100 : null;
                const avg = row.projects.length > 0 ? row.actual / row.projects.length : 0;
                return (
                  <div key={row.category}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : row.category)}
                      className="w-full text-left px-5 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={cn(
                            'h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0',
                            isOpen && 'rotate-90',
                          )}
                        />
                        <span className="font-medium text-sm truncate flex-1">{labelFor(row.category)}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {row.projects.length} {row.projects.length === 1 ? 'project' : 'projects'}
                        </span>
                        <span className="font-mono text-sm font-semibold shrink-0">{currency(row.actual)}</span>
                      </div>
                      <div className="mt-2 pl-5 space-y-1">
                        <div className="h-1.5 bg-muted rounded-none overflow-hidden flex">
                          <div
                            className="bg-primary h-full"
                            style={{ width: `${(row.actual / max) * 100}%` }}
                          />
                        </div>
                        <div className="h-1.5 bg-muted rounded-none overflow-hidden flex">
                          <div
                            className="bg-muted-foreground/40 h-full"
                            style={{ width: `${(row.budgeted / max) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                          <span>Budget {currency(row.budgeted)}</span>
                          {variancePct !== null && (
                            <span className={variancePct > 0 ? 'text-destructive' : 'text-primary'}>
                              {variancePct > 0 ? '+' : ''}
                              {variancePct.toFixed(0)}%
                            </span>
                          )}
                          <span>Avg {currency(avg)}</span>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-3 pl-10 space-y-1.5 bg-muted/20">
                        {row.projects.map((p) => (
                          <div key={p.projectId} className="flex items-center gap-2 text-xs">
                            <span className="truncate flex-1">{p.projectName}</span>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                              {p.status}
                            </span>
                            <span className="font-mono text-muted-foreground shrink-0">
                              {currency(p.budgeted)}
                            </span>
                            <span className="font-mono font-semibold shrink-0 w-20 text-right">
                              {currency(p.actual)}
                            </span>
                          </div>
                        ))}
                        {onUseAmount && avg > 0 && (
                          <div className="pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => onUseAmount(row.category, Math.round(avg))}
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" />
                              Use avg {currency(avg)}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
