import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoanStatusBadge, LoanTypeBadge } from './LoanStatusBadge';
import { LOAN_TYPE_LABELS, LOAN_TYPE_COLORS, calcFirstPaymentDate, calcNextPaymentDate, buildAmortizationSchedule } from '@/types/loans';
import { cn } from '@/lib/utils';
import type { Loan, LoanStatus, LoanType } from '@/types/loans';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDisplayDate } from '@/lib/dateUtils';
import { loanBalanceWithDraws } from './LoanStatsRow';

const fmt = (v: number | null | undefined) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

type SortKey = keyof Loan;

interface LoanTableProps {
  loans: Loan[];
  projectNames: string[];
  compareMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

export function LoanTable({ loans, projectNames, compareMode, selectedIds = [], onToggleSelect }: LoanTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<LoanType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const PER_PAGE = 15;

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
    if (typeFilter !== 'all') list = list.filter(l => l.loan_type === typeFilter);
    if (projectFilter !== 'all') list = list.filter(l => l.project_name === projectFilter);
    list.sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [loans, search, statusFilter, typeFilter, projectFilter, sortKey, sortAsc]);

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

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

  const uniqueTypes = useMemo(() => [...new Set(loans.map(l => l.loan_type))], [loans]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lender, project…"
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

      {/* Quick type filters */}
      {uniqueTypes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => { setTypeFilter('all'); setPage(0); }}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              typeFilter === 'all'
                ? 'bg-primary/15 text-primary border-primary/40'
                : 'bg-card text-muted-foreground border-border hover:text-foreground',
            )}
          >
            All Types
          </button>
          {uniqueTypes.map(t => {
            const active = typeFilter === t;
            const c = LOAN_TYPE_COLORS[t] ?? LOAN_TYPE_COLORS.other;
            return (
              <button
                key={t}
                type="button"
                onClick={() => { setTypeFilter(active ? 'all' : t); setPage(0); }}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  active ? c.badge : 'bg-card text-muted-foreground border-border hover:text-foreground',
                )}
              >
                {LOAN_TYPE_LABELS[t] ?? t}
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border">
              {compareMode && <TableHead className="w-10" />}
              <TableHead>Project <SortBtn col="project_name" /></TableHead>
              <TableHead>Loan Name <SortBtn col="lender_name" /></TableHead>
              <TableHead>Type <SortBtn col="loan_type" /></TableHead>
              <TableHead className="text-right">Original <SortBtn col="original_amount" /></TableHead>
              <TableHead className="text-right">Balance <SortBtn col="outstanding_balance" /></TableHead>
              <TableHead className="text-right">Rate <SortBtn col="interest_rate" /></TableHead>
              <TableHead className="text-right">Monthly Pmt</TableHead>
              <TableHead>Maturity <SortBtn col="maturity_date" /></TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={compareMode ? 11 : 10} className="text-center py-12 text-muted-foreground">
                  No loans match your filters.
                </TableCell>
              </TableRow>
            ) : (
              visible.map(loan => {
                const isSelected = selectedIds.includes(loan.id);
                return (
                <TableRow
                  key={loan.id}
                  className={`cursor-pointer hover:bg-muted/40 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                  onClick={() => compareMode ? onToggleSelect?.(loan.id) : navigate(`/loans/${loan.id}`)}
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
                  <TableCell className="font-medium max-w-32 truncate">{loan.project_name ?? '—'}</TableCell>
                  <TableCell className="max-w-32 truncate">{loan.nickname ?? loan.lender_name}</TableCell>
                  <TableCell><LoanTypeBadge type={loan.loan_type} /></TableCell>
                  <TableCell className="text-right">{fmt(loan.original_amount)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(loanBalanceWithDraws(loan))}</TableCell>
                  <TableCell className="text-right">{loan.interest_rate.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{fmt(loan.monthly_payment)}</TableCell>
                  <TableCell className="text-sm">{formatDisplayDate(loan.maturity_date)}</TableCell>
                  <TableCell><LoanStatusBadge status={loan.status} /></TableCell>
                  <TableCell className="text-sm">
                    {(() => {
                      const first = loan.first_payment_date || calcFirstPaymentDate(loan.start_date, loan.payment_frequency);
                      const next = calcNextPaymentDate(first, loan.payment_frequency);
                      return formatDisplayDate(next);
                    })()}
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} loans</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="flex items-center px-2">
              {page + 1} / {pages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
