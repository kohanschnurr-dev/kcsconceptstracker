import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Search, LayoutGrid, List, FolderOpen, Layers, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoanStatusBadge, LoanTypeBadge } from './LoanStatusBadge';
import {
  currentAccruedInterest,
  calcFirstPaymentDate,
  calcNextPaymentDate,
  effectiveOutstandingBalance,
  LOAN_TYPE_COLORS,
} from '@/types/loans';
import { getEffectivePayments } from '@/lib/loanPayments';
import type { Loan, LoanStatus, LoanPayment, LoanDraw } from '@/types/loans';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDisplayDate } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const fmt = (v: number | null | undefined) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

type SortKey = keyof Loan | 'balance_calc' | 'interest_accrued' | 'next_payment';
type ViewMode = 'table' | 'cards';

interface LoanTableProps {
  loans: Loan[];
  projectNames: string[];
  compareMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

interface EnrichedLoan {
  loan: Loan;
  balance: number;
  interest: number | null;
}

const DEFAULT_VIEW_KEY = 'loans:defaultView';
type DefaultView = { viewMode: ViewMode; groupByProject: boolean };

function readDefaultView(): DefaultView {
  if (typeof window === 'undefined') return { viewMode: 'table', groupByProject: false };
  try {
    const raw = window.localStorage.getItem(DEFAULT_VIEW_KEY);
    if (!raw) return { viewMode: 'table', groupByProject: false };
    const parsed = JSON.parse(raw);
    return {
      viewMode: parsed.viewMode === 'cards' ? 'cards' : 'table',
      groupByProject: !!parsed.groupByProject,
    };
  } catch {
    return { viewMode: 'table', groupByProject: false };
  }
}

export function LoanTable({ loans, projectNames, compareMode, selectedIds = [], onToggleSelect }: LoanTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const initialDefault = useMemo(readDefaultView, []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(initialDefault.viewMode);
  const [groupByProject, setGroupByProject] = useState(initialDefault.groupByProject);
  const [defaultView, setDefaultView] = useState<DefaultView>(initialDefault);
  const [expandedBalances, setExpandedBalances] = useState<Set<string>>(new Set());
  const PER_PAGE = 15;

  const toggleBalanceExpand = (id: string) => {
    setExpandedBalances(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const saveDefaultView = (next: DefaultView, label: string) => {
    setDefaultView(next);
    try {
      window.localStorage.setItem(DEFAULT_VIEW_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    toast({ title: 'Default view saved', description: `${label} will load by default.` });
  };

  const loanIds = useMemo(() => loans.map(l => l.id).sort(), [loans]);

  const { data: payments = [] } = useQuery<LoanPayment[]>({
    queryKey: ['loan_payments_for_table', loanIds],
    enabled: loanIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase.from('loan_payments' as any) as any)
        .select('loan_id, date, amount, principal_portion, interest_portion, late_fee')
        .in('loan_id', loanIds);
      if (error) throw error;
      return (data ?? []).map((p: any) => ({ ...p, payment_date: p.date })) as LoanPayment[];
    },
  });

  const { data: draws = [] } = useQuery<LoanDraw[]>({
    queryKey: ['loan_draws_for_table', loanIds],
    enabled: loanIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase.from('loan_draws' as any) as any)
        .select('id, loan_id, draw_amount, draw_number, status, date_funded, expected_date, interest_rate_override, fee_amount, fee_percentage, milestone_name')
        .in('loan_id', loanIds);
      if (error) throw error;
      return (data ?? []) as LoanDraw[];
    },
  });

  const paymentsByLoan = useMemo(() => {
    const m: Record<string, LoanPayment[]> = {};
    for (const p of payments) {
      const key = (p as any).loan_id;
      if (!key) continue;
      (m[key] = m[key] ?? []).push(p);
    }
    return m;
  }, [payments]);

  const drawsByLoan = useMemo(() => {
    const m: Record<string, LoanDraw[]> = {};
    for (const d of draws) {
      const key = (d as any).loan_id;
      if (!key) continue;
      (m[key] = m[key] ?? []).push(d);
    }
    return m;
  }, [draws]);

  const filtered = useMemo(() => {
    let list = [...loans];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        l =>
          (l.nickname ?? '').toLowerCase().includes(q) ||
          l.lender_name.toLowerCase().includes(q) ||
          (l.project_name ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') list = list.filter(l => l.status === statusFilter);
    if (projectFilter !== 'all') list = list.filter(l => l.project_name === projectFilter);

    const getSortVal = (l: Loan): any => {
      if (sortKey === 'balance_calc')
        return effectiveOutstandingBalance(l, getEffectivePayments(l, paymentsByLoan[l.id] ?? []));
      if (sortKey === 'interest_accrued') {
        if (l.loan_type === 'dscr') return null;
        return currentAccruedInterest(l, paymentsByLoan[l.id] ?? [], drawsByLoan[l.id] ?? []);
      }
      if (sortKey === 'next_payment') {
        const first = l.first_payment_date || calcFirstPaymentDate(l.start_date, l.payment_frequency);
        const next = calcNextPaymentDate(first, l.payment_frequency);
        return next ? new Date(next).getTime() : null;
      }
      return (l as any)[sortKey];
    };

    list.sort((a, b) => {
      const av = getSortVal(a);
      const bv = getSortVal(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [loans, search, statusFilter, projectFilter, sortKey, sortAsc, paymentsByLoan, drawsByLoan]);

  // Enrich every filtered loan with computed balance and interest
  const enrichedFiltered = useMemo<EnrichedLoan[]>(() => {
    return filtered.map(loan => {
      const lps = paymentsByLoan[loan.id] ?? [];
      const lds = drawsByLoan[loan.id] ?? [];
      const balance = effectiveOutstandingBalance(loan, getEffectivePayments(loan, lps));
      const interest = loan.loan_type === 'dscr' ? null : currentAccruedInterest(loan, lps, lds);
      return { loan, balance, interest };
    });
  }, [filtered, paymentsByLoan, drawsByLoan]);

  // Grand totals across all filtered loans
  const totals = useMemo(() => ({
    original: enrichedFiltered.reduce((s, { loan }) => s + (loan.original_amount ?? 0), 0),
    balance: enrichedFiltered.reduce((s, { balance }) => s + balance, 0),
    monthly: enrichedFiltered.reduce((s, { loan }) => s + (loan.monthly_payment ?? 0), 0),
  }), [enrichedFiltered]);

  // Stable ordered map of project → loans (preserves sort order within each group)
  const projectGroups = useMemo(() => {
    const groups = new Map<string, EnrichedLoan[]>();
    for (const item of enrichedFiltered) {
      const key = item.loan.project_name ?? 'No Project';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return groups;
  }, [enrichedFiltered]);

  const pages = Math.ceil(filtered.length / PER_PAGE);
  // Pagination only applies to flat table mode
  const visibleEnriched =
    viewMode === 'table' && !groupByProject
      ? enrichedFiltered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
      : enrichedFiltered;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(0);
  };

  const SortBtn = ({ col }: { col: SortKey }) => (
    <button onClick={() => toggleSort(col)} className="inline-flex items-center gap-1 hover:text-foreground">
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );

  // 9 cols when compare checkbox is present, 8 otherwise
  const colCount = compareMode ? 9 : 8;

  const renderLoanRow = ({ loan, balance, interest }: EnrichedLoan) => {
    const isSelected = selectedIds.includes(loan.id);
    const first = loan.first_payment_date || calcFirstPaymentDate(loan.start_date, loan.payment_frequency);
    const next = calcNextPaymentDate(first, loan.payment_frequency);

    return (
      <TableRow
        key={loan.id}
        className={cn('cursor-pointer hover:bg-muted/40 transition-colors', isSelected && 'bg-primary/5')}
        onClick={() => (compareMode ? onToggleSelect?.(loan.id) : navigate(`/loans/${loan.id}`))}
      >
        {compareMode && (
          <TableCell className="w-10" onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              disabled={!isSelected && selectedIds.length >= 3}
              onCheckedChange={() => onToggleSelect?.(loan.id)}
            />
          </TableCell>
        )}
        <TableCell className="font-medium max-w-32 truncate text-center">{loan.project_name ?? '—'}</TableCell>
        <TableCell className="max-w-32 truncate text-center">{loan.nickname ?? loan.lender_name}</TableCell>
        <TableCell className="text-center"><div className="flex justify-center"><LoanTypeBadge type={loan.loan_type} /></div></TableCell>
        <TableCell className="text-center">
          {(() => {
            const isExpanded = expandedBalances.has(loan.id);
            const hasDetails = loan.original_amount != null || (interest != null && interest > 0);
            return (
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5">
                  <span className="font-medium">{fmt(balance)}</span>
                  {hasDetails && (
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                      onClick={(e) => { e.stopPropagation(); toggleBalanceExpand(loan.id); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
                {isExpanded && hasDetails && (
                  <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    of {fmt(loan.original_amount)}
                    {interest != null && interest > 0 && (
                      <span className="ml-1.5 text-warning">· ↑{fmt(interest)} accrued</span>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </TableCell>
        <TableCell className="text-center">{fmt(loan.monthly_payment)}</TableCell>
        <TableCell className="text-sm text-center">{formatDisplayDate(loan.maturity_date)}</TableCell>
        <TableCell className="text-center"><div className="flex justify-center"><LoanStatusBadge status={loan.status} /></div></TableCell>
        <TableCell className="text-sm text-center">{formatDisplayDate(next)}</TableCell>
      </TableRow>
    );
  };

  const renderTableBody = () => {
    if (enrichedFiltered.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={colCount} className="text-center py-12 text-muted-foreground">
            No loans match your filters.
          </TableCell>
        </TableRow>
      );
    }

    if (groupByProject) {
      const rows: React.ReactNode[] = [];

      projectGroups.forEach((items, projectName) => {
        const sub = {
          original: items.reduce((s, { loan }) => s + (loan.original_amount ?? 0), 0),
          balance: items.reduce((s, { balance }) => s + balance, 0),
          monthly: items.reduce((s, { loan }) => s + (loan.monthly_payment ?? 0), 0),
        };

        rows.push(
          <TableRow key={`grp-${projectName}`} className="bg-muted/40 hover:bg-muted/40 border-t border-border">
            <TableCell colSpan={colCount} className="py-2 px-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-semibold text-sm">{projectName}</span>
                <span className="text-xs text-muted-foreground">
                  ({items.length} {items.length === 1 ? 'loan' : 'loans'})
                </span>
              </div>
            </TableCell>
          </TableRow>,
        );

        items.forEach(item => rows.push(renderLoanRow(item)));

        // Per-project subtotal row
        rows.push(
          <TableRow
            key={`sub-${projectName}`}
            className="bg-muted/20 hover:bg-muted/20 border-t border-dashed border-border/60"
          >
            {compareMode && <TableCell />}
            <TableCell colSpan={3} className="text-center text-xs text-muted-foreground italic py-2">
              Subtotal — {projectName}
            </TableCell>
            <TableCell className="text-center py-2">
              <div className="text-xs font-semibold">{fmt(sub.balance)}</div>
              <div className="text-xs text-muted-foreground">of {fmt(sub.original)}</div>
            </TableCell>
            <TableCell className="text-center text-xs font-semibold py-2">{fmt(sub.monthly)}</TableCell>
            <TableCell colSpan={3} />
          </TableRow>,
        );
      });

      return <>{rows}</>;
    }

    return visibleEnriched.map(item => renderLoanRow(item));
  };

  return (
    <div className="space-y-3">
      {/* View toggles + filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Unified view toggle: Table / Cards / Group */}
        <div className="group/vt relative flex rounded-md border border-border [&>button:first-child]:rounded-l-[5px] [&>button:last-child]:rounded-r-[5px]">
          {/* Table */}
          <button
            className={cn(
              'group/btn relative h-9 w-9 flex items-center justify-center transition-colors',
              viewMode === 'table'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
            onClick={() => setViewMode('table')}
            title="Table view"
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
            <Star
              role="button"
              tabIndex={0}
              aria-label={defaultView.viewMode === 'table' ? 'Default view: Table' : 'Set Table as default view'}
              onClick={(e) => {
                e.stopPropagation();
                saveDefaultView({ ...defaultView, viewMode: 'table' }, 'Table view');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  saveDefaultView({ ...defaultView, viewMode: 'table' }, 'Table view');
                }
              }}
              className={cn(
                'absolute -top-1.5 -right-1.5 h-3 w-3 cursor-pointer transition-opacity z-10',
                defaultView.viewMode === 'table'
                  ? 'opacity-100 fill-primary text-primary'
                  : 'opacity-0 group-hover/btn:opacity-60 hover:!opacity-100 text-muted-foreground',
              )}
            />
          </button>
          {/* Cards */}
          <button
            className={cn(
              'group/btn relative h-9 w-9 flex items-center justify-center border-l border-border transition-colors',
              viewMode === 'cards'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
            onClick={() => setViewMode('cards')}
            title="Card view"
            aria-label="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
            <Star
              role="button"
              tabIndex={0}
              aria-label={defaultView.viewMode === 'cards' ? 'Default view: Cards' : 'Set Cards as default view'}
              onClick={(e) => {
                e.stopPropagation();
                saveDefaultView({ ...defaultView, viewMode: 'cards' }, 'Card view');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  saveDefaultView({ ...defaultView, viewMode: 'cards' }, 'Card view');
                }
              }}
              className={cn(
                'absolute -top-1.5 -right-1.5 h-3 w-3 cursor-pointer transition-opacity z-10',
                defaultView.viewMode === 'cards'
                  ? 'opacity-100 fill-primary text-primary'
                  : 'opacity-0 group-hover/btn:opacity-60 hover:!opacity-100 text-muted-foreground',
              )}
            />
          </button>
          {/* Group (auto-switches to table view when enabled) */}
          <button
            className={cn(
              'group/btn relative h-9 w-9 flex items-center justify-center border-l border-border transition-colors',
              groupByProject && viewMode === 'table'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
            onClick={() => {
              const next = !groupByProject;
              setGroupByProject(next);
              if (next && viewMode !== 'table') setViewMode('table');
            }}
            title={groupByProject ? 'Ungroup' : 'Group by project'}
            aria-label={groupByProject ? 'Ungroup' : 'Group by project'}
          >
            <Layers className="h-4 w-4" />
            <Star
              role="button"
              tabIndex={0}
              aria-label={defaultView.groupByProject ? 'Default: Grouped on' : 'Set current Group state as default'}
              onClick={(e) => {
                e.stopPropagation();
                saveDefaultView({ ...defaultView, groupByProject }, groupByProject ? 'Group on' : 'Group off');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  saveDefaultView({ ...defaultView, groupByProject }, groupByProject ? 'Group on' : 'Group off');
                }
              }}
              className={cn(
                'absolute -top-1.5 -right-1.5 h-3 w-3 cursor-pointer transition-opacity z-10',
                defaultView.groupByProject === groupByProject
                  ? 'opacity-100 fill-primary text-primary'
                  : 'opacity-0 group-hover/btn:opacity-60 hover:!opacity-100 text-muted-foreground',
              )}
            />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lender, project, purpose…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-8 h-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as any); setPage(0); }}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid_off">Paid Off</SelectItem>
            <SelectItem value="default">Default</SelectItem>
          </SelectContent>
        </Select>
        {projectNames.length > 0 && (
          <Select value={projectFilter} onValueChange={v => { setProjectFilter(v); setPage(0); }}>
            <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projectNames.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Card view */}
      {viewMode === 'cards' && (
        enrichedFiltered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No loans match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedFiltered.map(({ loan, balance, interest }) => {
              const typeColor = LOAN_TYPE_COLORS[loan.loan_type]?.hsl ?? LOAN_TYPE_COLORS.other.hsl;
              const first = loan.first_payment_date || calcFirstPaymentDate(loan.start_date, loan.payment_frequency);
              const next = calcNextPaymentDate(first, loan.payment_frequency);

              return (
                <div
                  key={loan.id}
                  className="rounded-lg bg-card cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'hsl(var(--border))',
                    borderLeftColor: typeColor,
                    borderLeftWidth: '4px',
                  }}
                  onClick={() => navigate(`/loans/${loan.id}`)}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground truncate">{loan.project_name ?? 'No Project'}</div>
                        <div className="font-semibold text-sm mt-0.5 leading-tight truncate">
                          {loan.nickname ?? loan.lender_name}
                        </div>
                      </div>
                      <LoanStatusBadge status={loan.status} />
                    </div>

                    <div className="flex items-center gap-2">
                      <LoanTypeBadge type={loan.loan_type} />
                      <span className="text-xs text-muted-foreground">{loan.interest_rate}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-2 border-t border-border/50">
                      <div>
                        <div className="text-xs text-muted-foreground">Balance</div>
                        <div className="font-semibold text-sm">{fmt(balance)}</div>
                        <div className="text-xs text-muted-foreground">of {fmt(loan.original_amount)}</div>
                        {interest != null && interest > 0 && (
                          <div className="text-xs text-warning mt-0.5">↑ {fmt(interest)} accrued</div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Monthly Pmt</div>
                        <div className="font-semibold text-sm">{fmt(loan.monthly_payment)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Maturity</div>
                        <div className="text-sm">{formatDisplayDate(loan.maturity_date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Next Payment</div>
                        <div className="text-sm">{formatDisplayDate(next)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <>
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border">
                  {compareMode && <TableHead className="w-10" />}
                  <TableHead className="text-center">Project <SortBtn col="project_name" /></TableHead>
                  <TableHead className="text-center">Loan Purpose <SortBtn col="lender_name" /></TableHead>
                  <TableHead className="text-center">Type <SortBtn col="loan_type" /></TableHead>
                  <TableHead className="text-center">Balance <SortBtn col="balance_calc" /></TableHead>
                  <TableHead className="text-center">Monthly Pmt <SortBtn col="monthly_payment" /></TableHead>
                  <TableHead className="text-center">Maturity <SortBtn col="maturity_date" /></TableHead>
                  <TableHead className="text-center">Status <SortBtn col="status" /></TableHead>
                  <TableHead className="text-center">Next Payment <SortBtn col="next_payment" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableBody()}

                {/* Grand totals row */}
                {enrichedFiltered.length > 0 && (
                  <TableRow className="bg-muted/30 border-t-2 border-border hover:bg-muted/30">
                    {compareMode && <TableCell />}
                    <TableCell colSpan={3} className="py-3 font-bold text-sm text-center">
                      Total ({enrichedFiltered.length} {enrichedFiltered.length === 1 ? 'loan' : 'loans'})
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <div className="font-bold text-sm">{fmt(totals.balance)}</div>
                      <div className="text-xs text-muted-foreground">of {fmt(totals.original)}</div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm py-3">{fmt(totals.monthly)}</TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination (flat mode only) */}
          {!groupByProject && pages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{filtered.length} loans</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="flex items-center px-2">{page + 1} / {pages}</span>
                <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
