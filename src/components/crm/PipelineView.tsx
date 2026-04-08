import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContactStatusBadge, WarmthIndicator } from './CRMStatusBadge';
import { PIPELINE_COLUMNS, CONTACT_STATUS_CONFIG } from '@/types/crm';
import type { CRMContact, ContactStatus } from '@/types/crm';
import { cn } from '@/lib/utils';

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function formatFollowUp(d: string | null): { label: string; className: string } | null {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: 'text-destructive' };
  if (days === 0) return { label: 'Today', className: 'text-warning' };
  return { label: `in ${days}d`, className: 'text-success' };
}

interface PipelineCardProps {
  contact: CRMContact;
  isDragging: boolean;
  onDragStart: () => void;
}

function PipelineCard({ contact, isDragging, onDragStart }: PipelineCardProps) {
  const navigate = useNavigate();
  const followUp = formatFollowUp(contact.next_followup_at);
  const daysIn = daysSince(contact.created_at);

  return (
    <Card
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onClick={() => navigate(`/crm/${contact.id}`)}
      className={cn(
        'glass-card cursor-grab active:cursor-grabbing select-none transition-all duration-150',
        isDragging ? 'opacity-40 scale-95 rotate-1' : 'hover:border-primary/30 hover:shadow-lg',
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-sm font-semibold truncate">
              {contact.first_name} {contact.last_name}
            </span>
            <WarmthIndicator contact={contact} />
          </div>
          {contact.is_dnc && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-destructive/20 text-destructive border-destructive/30 flex-shrink-0">DNC</Badge>
          )}
        </div>
        {contact.property_address && (
          <p className="text-xs text-muted-foreground truncate">{contact.property_address}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>{contact.phone}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {daysIn}d in stage
          </span>
          {followUp && (
            <span className={cn('flex items-center gap-1 font-medium', followUp.className)}>
              <Calendar className="h-3 w-3" />
              {followUp.label}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PipelineViewProps {
  contacts: CRMContact[];
  onMove: (id: string, status: ContactStatus) => void;
}

export function PipelineView({ contacts, onMove }: PipelineViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ContactStatus | null>(null);
  const dragRef = useRef<string | null>(null);

  const grouped = PIPELINE_COLUMNS.reduce<Record<ContactStatus, CRMContact[]>>(
    (acc, col) => ({
      ...acc,
      [col.id]: contacts.filter(c => c.status === col.id && !c.is_dnc),
    }),
    {} as Record<ContactStatus, CRMContact[]>,
  );

  const handleDrop = (colId: ContactStatus) => {
    if (dragRef.current && dragRef.current !== colId) {
      onMove(dragRef.current, colId);
    }
    setDraggingId(null);
    setDragOverCol(null);
    dragRef.current = null;
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
      {PIPELINE_COLUMNS.map(col => {
        const cards = grouped[col.id] ?? [];
        const cfg = CONTACT_STATUS_CONFIG[col.id];
        return (
          <div
            key={col.id}
            className={cn(
              'flex-shrink-0 w-60 flex flex-col rounded-xl border border-border bg-card/50 transition-colors',
              dragOverCol === col.id && 'border-primary/50 bg-primary/5',
            )}
            onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => handleDrop(col.id)}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
              <span className={cn('text-xs font-semibold uppercase tracking-wide', cfg.className.includes('text-') ? cfg.className.split(' ').find(c => c.startsWith('text-')) : 'text-foreground')}>
                {col.label}
              </span>
              <Badge variant="outline" className="text-xs h-5 px-1.5 bg-muted text-muted-foreground">
                {cards.length}
              </Badge>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
              {cards.length === 0 ? (
                <div className="flex items-center justify-center h-16 text-xs text-muted-foreground opacity-50 border border-dashed border-border rounded-lg">
                  Drop here
                </div>
              ) : (
                cards.map(c => (
                  <PipelineCard
                    key={c.id}
                    contact={c}
                    isDragging={draggingId === c.id}
                    onDragStart={() => { setDraggingId(c.id); dragRef.current = c.id; }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
