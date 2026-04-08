import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CONTACT_STATUS_CONFIG, CONTACT_TYPE_LABELS, getWarmthColor, getWarmthScore } from '@/types/crm';
import type { ContactStatus, ContactType, CRMContact } from '@/types/crm';
import { Flame } from 'lucide-react';

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const cfg = CONTACT_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('text-xs font-medium whitespace-nowrap', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

export function ContactTypeBadge({ type }: { type: ContactType }) {
  return (
    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
      {CONTACT_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}

export function WarmthIndicator({ contact }: { contact: Pick<CRMContact, 'status' | 'motivation_level' | 'last_contacted_at'> }) {
  const score = getWarmthScore(contact);
  const color = getWarmthColor(score);
  if (score < 3) return null;
  return (
    <span title={`Lead warmth: ${score}/10`}>
      <Flame className={cn('h-3.5 w-3.5', color)} />
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string | null }) {
  const config = {
    high:   'bg-destructive',
    medium: 'bg-warning',
    low:    'bg-muted-foreground',
  };
  if (!priority) return null;
  return (
    <span
      title={`Priority: ${priority}`}
      className={cn('inline-block h-2 w-2 rounded-full flex-shrink-0', config[priority as keyof typeof config] ?? 'bg-muted-foreground')}
    />
  );
}
