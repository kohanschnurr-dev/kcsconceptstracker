import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, Phone, Mail, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { ContactStatusBadge, ContactTypeBadge, WarmthIndicator, PriorityDot } from './CRMStatusBadge';
import { CONTACT_STATUS_CONFIG, CONTACT_TYPE_LABELS } from '@/types/crm';
import type { CRMContact, ContactStatus, ContactType } from '@/types/crm';
import { cn } from '@/lib/utils';

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function FollowUpCell({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  const d = new Date(date);
  const now = new Date();
  const isOverdue = d < now;
  const isToday = d.toDateString() === now.toDateString();
  return (
    <span className={cn(
      'text-sm font-medium',
      isOverdue && 'text-destructive',
      isToday && !isOverdue && 'text-warning',
      !isOverdue && !isToday && 'text-success',
    )}>
      {fmtDate(date)}
    </span>
  );
}

interface ContactsViewProps {
  contacts: CRMContact[];
  onDelete: (ids: string[]) => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
}

type SortKey = 'full_name' | 'status' | 'last_contacted_at' | 'next_followup_at' | 'created_at';

const PER_PAGE = 20;

export function ContactsView({ contacts, onDelete, onStatusChange }: ContactsViewProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const uniqueSources = useMemo(() => [...new Set(contacts.map(c => c.source))].sort(), [contacts]);
  const uniqueTypes = useMemo(() => [...new Set(contacts.map(c => c.contact_type))], [contacts]);

  const filtered = useMemo(() => {
    let list = [...contacts];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.property_address ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter(c => c.contact_type === typeFilter);
    if (sourceFilter !== 'all') list = list.filter(c => c.source === sourceFilter);
    list.sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === 'full_name') { av = `${a.first_name} ${a.last_name}`; bv = `${b.first_name} ${b.last_name}`; }
      else { av = a[sortKey]; bv = b[sortKey]; }
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [contacts, search, statusFilter, typeFilter, sourceFilter, sortKey, sortAsc]);

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const toggleSort = (key: SortKey) => {
    setSortKey(k => { if (k === key) { setSortAsc(a => !a); return k; } setSortAsc(true); return key; });
    setPage(0);
  };
  const SortBtn = ({ col }: { col: SortKey }) => (
    <button onClick={() => toggleSort(col)}><ArrowUpDown className="h-3.5 w-3.5 inline ml-1 opacity-50 hover:opacity-100" /></button>
  );

  const toggleSelect = (id: string) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const allSelected = visible.length > 0 && visible.every(c => selected.has(c.id));
  const toggleAll = () => {
    if (allSelected) setSelected(s => { const n = new Set(s); visible.forEach(c => n.delete(c.id)); return n; });
    else setSelected(s => { const n = new Set(s); visible.forEach(c => n.add(c.id)); return n; });
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, phone, address…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-8 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as any); setPage(0); }}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(CONTACT_STATUS_CONFIG).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v as any); setPage(0); }}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(t => <SelectItem key={t} value={t}>{CONTACT_TYPE_LABELS[t] ?? t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={v => { setSourceFilter(v); setPage(0); }}>
          <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <Select onValueChange={status => { selected.forEach(id => onStatusChange(id, status as ContactStatus)); setSelected(new Set()); }}>
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="Change status" /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTACT_STATUS_CONFIG).map(([v, c]) => (
                <SelectItem key={v} value={v}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="destructive" onClick={() => setDeleteConfirm(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Name <SortBtn col="full_name" /></TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status <SortBtn col="status" /></TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Last Contact <SortBtn col="last_contacted_at" /></TableHead>
              <TableHead>Next Follow-Up <SortBtn col="next_followup_at" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No contacts match your filters.
                </TableCell>
              </TableRow>
            ) : (
              visible.map(contact => (
                <TableRow
                  key={contact.id}
                  className={cn('cursor-pointer hover:bg-muted/40 transition-colors', contact.is_dnc && 'opacity-60')}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-check]')) return;
                    navigate(`/crm/${contact.id}`);
                  }}
                >
                  <TableCell data-check onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selected.has(contact.id)} onCheckedChange={() => toggleSelect(contact.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <PriorityDot priority={contact.priority} />
                      <span className="font-medium">{contact.first_name} {contact.last_name}</span>
                      <WarmthIndicator contact={contact} />
                    </div>
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {contact.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1 bg-muted/50">{tag}</Badge>
                        ))}
                        {contact.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{contact.tags.length - 2}</span>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`tel:${contact.phone}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                    >
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {contact.phone}
                    </a>
                  </TableCell>
                  <TableCell><ContactTypeBadge type={contact.contact_type} /></TableCell>
                  <TableCell><ContactStatusBadge status={contact.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{contact.source}</TableCell>
                  <TableCell className="text-sm">{fmtDate(contact.last_contacted_at)}</TableCell>
                  <TableCell><FollowUpCell date={contact.next_followup_at} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} contacts</span>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="px-2">{page + 1} / {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} contact{selected.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. All activities, follow-ups, and offers for these contacts will also be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => {
              onDelete([...selected]);
              setSelected(new Set());
              setDeleteConfirm(false);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
